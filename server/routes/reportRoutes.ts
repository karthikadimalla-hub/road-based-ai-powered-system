import { Router, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../database/db.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { analyzeRoadHazard } from '../ai/gemini.js';
import { detectDuplicates, calculatePriorityScore, calculateDistanceMeters } from '../utils/geo.js';

const router = Router();

// POST /api/reports - Submit a new road hazard report
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      category: rawCategory,
      description,
      image, // base64 string or url
      mimeType,
      latitude,
      longitude,
      location_name,
      landmark,
      city,
      ward,
      additional_comments,
    } = req.body;

    // 1. Validation
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a clear description of the hazard (at least 5 characters).' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon) || lat < 6.0 || lat > 38.0 || lon < 68.0 || lon > 98.0) {
      return res.status(400).json({
        error: 'Please specify valid geographic coordinates located within India (Lat: 6°-38° N, Lon: 68°-98° E).',
      });
    }

    if (!location_name || location_name.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a valid location address or street name.' });
    }

    // 2. Validate and handle image
    let imageUrl = image;
    if (!imageUrl) {
      // Default placeholder if none provided
      imageUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23334155"/><text x="50%" y="50%" fill="%2394a3b8" font-size="20" font-family="sans-serif" text-anchor="middle">Citizen Hazard Photo</text></svg>`;
    } else if (imageUrl.startsWith('data:')) {
      // Check size limit: ~10MB base64 is ~13.5MB string
      if (imageUrl.length > 15 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image size exceeds the 10MB limit. Please upload a smaller photo.' });
      }
    }

    // 3. AI Analysis via Gemini
    const fullTextDescription = `${description} ${additional_comments ? `(Additional notes: ${additional_comments})` : ''}`.trim();
    const aiResult = await analyzeRoadHazard(
      imageUrl.startsWith('data:image') ? imageUrl : null,
      mimeType || 'image/jpeg',
      fullTextDescription,
      rawCategory
    );

    const finalCategory = aiResult.category;
    const finalSeverity = aiResult.severity;
    const aiConfidence = aiResult.confidence;

    // 4. Duplicate Hazard Detection (query nearby open reports within 200m)
    const existingReports = await queryAll<{
      id: string;
      incident_id: string | null;
      latitude: number;
      longitude: number;
      category: string;
      description: string;
      created_at: string;
      status: string;
    }>('SELECT id, incident_id, latitude, longitude, category, description, created_at, status FROM reports');

    const duplicateCheck = detectDuplicates(
      {
        latitude: lat,
        longitude: lon,
        category: finalCategory,
        description: fullTextDescription,
      },
      existingReports
    );

    // 5. Transparent Priority Score Calculation
    const clusterSize = duplicateCheck.isDuplicate
      ? duplicateCheck.clusterCount + 1
      : 1;

    const priorityBreakdown = calculatePriorityScore(
      finalSeverity,
      clusterSize,
      aiConfidence
    );

    // 6. Manage Incident
    let incidentId = duplicateCheck.incidentId;
    const nowIso = new Date().toISOString();

    if (!incidentId) {
      // Create new incident
      const incCount = await queryOne<{ total: number }>('SELECT count(*) as total FROM incidents');
      const incNum = 100 + ((incCount?.total || 0) + 1);
      incidentId = `INC-2026-00${incNum}`;

      await runQuery(
        `INSERT INTO incidents (id, title, category, latitude, longitude, priority, status, assigned_to, report_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incidentId,
          `${finalCategory.replace('_', ' ').toUpperCase()} on ${location_name}`,
          finalCategory,
          lat,
          lon,
          priorityBreakdown.priority,
          'Reported',
          null,
          1,
          nowIso,
          nowIso,
        ]
      );
    } else {
      // Increment incident report count & update priority if higher
      await runQuery(
        `UPDATE incidents SET report_count = report_count + 1, updated_at = ? WHERE id = ?`,
        [nowIso, incidentId]
      );
    }

    // 7. Save Report
    const repCount = await queryOne<{ total: number }>('SELECT count(*) as total FROM reports');
    const repNum = 100 + ((repCount?.total || 0) + 1);
    const reportId = `REP-2026-00${repNum}`;

    const userId = req.user ? req.user.userId : null;

    await runQuery(
      `INSERT INTO reports (
        id, user_id, incident_id, category, description, image_url,
        latitude, longitude, location_name, landmark, city, ward,
        severity, priority, priority_score, priority_reasoning,
        ai_confidence, ai_analysis, is_duplicate, duplicate_of_report_id,
        status, assigned_to, upvotes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        userId,
        incidentId,
        finalCategory,
        fullTextDescription,
        imageUrl,
        lat,
        lon,
        location_name.trim(),
        landmark ? landmark.trim() : null,
        city ? city.trim() : 'Hyderabad',
        ward ? ward.trim() : null,
        finalSeverity,
        priorityBreakdown.priority,
        priorityBreakdown.score,
        priorityBreakdown.reasoning,
        aiConfidence,
        JSON.stringify(aiResult),
        duplicateCheck.isDuplicate ? 1 : 0,
        duplicateCheck.relatedReportId,
        'Reported',
        null,
        1,
        nowIso,
        nowIso,
      ]
    );

    // 8. If duplicate, record relation
    if (duplicateCheck.isDuplicate && duplicateCheck.relatedReportId) {
      const relationId = `rel_${Date.now()}`;
      await runQuery(
        `INSERT INTO report_relations (id, report_id, related_report_id, relation_type, distance_meters, similarity_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          relationId,
          reportId,
          duplicateCheck.relatedReportId,
          'duplicate',
          duplicateCheck.distanceMeters,
          duplicateCheck.similarityScore,
          nowIso,
        ]
      );
    }

    // 9. Initial Status History
    await runQuery(
      `INSERT INTO status_history (id, report_id, status, changed_by, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `hist_${Date.now()}`,
        reportId,
        'Reported',
        req.user?.name || 'Citizen Submission',
        'Report created and verified through RoadSafe Sentinel AI.',
        nowIso,
      ]
    );

    // Fetch the newly created report
    const newReport = await queryOne('SELECT * FROM reports WHERE id = ?', [reportId]);

    // Fetch details of the matched duplicate report if found
    let matchedReport = null;
    if (duplicateCheck.isDuplicate && duplicateCheck.relatedReportId) {
      matchedReport = await queryOne(
        'SELECT id, category, location_name, description, priority, severity, status, created_at, image_url, latitude, longitude FROM reports WHERE id = ?',
        [duplicateCheck.relatedReportId]
      );
    }

    // Also collect any nearby reports within 500m
    const nearbyReports = existingReports
      .filter((r) => r.id !== reportId)
      .map((r) => ({
        ...r,
        distanceMeters: calculateDistanceMeters(
          { latitude: lat, longitude: lon },
          { latitude: r.latitude, longitude: r.longitude }
        ),
      }))
      .filter((r) => r.distanceMeters <= 500)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 4);

    return res.status(201).json({
      success: true,
      message: 'Report submitted and analyzed successfully.',
      report: newReport,
      aiAnalysis: aiResult,
      duplicateInfo: duplicateCheck,
      matchedReport,
      nearbyReports,
      priorityBreakdown,
      incidentId,
    });
  } catch (err: any) {
    console.error('Error submitting report:', err);
    return res.status(500).json({ error: 'Failed to process and record road report. Please try again.' });
  }
});

// GET /api/reports - Query all reports with search & filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      category,
      priority,
      status,
      city,
      mine,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT r.*, 
        u.name as reporter_name,
        (SELECT count(*) FROM report_relations WHERE related_report_id = r.id OR report_id = r.id) as related_count
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ` AND r.category = ?`;
      params.push(category);
    }

    if (priority && priority !== 'all') {
      query += ` AND r.priority = ?`;
      params.push(priority);
    }

    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (city && city !== 'all') {
      query += ` AND r.city = ?`;
      params.push(city);
    }

    if (mine === 'true') {
      if (!req.user) {
        return res.status(401).json({ error: 'Please sign in to view your reports.' });
      }
      query += ` AND r.user_id = ?`;
      params.push(req.user.userId);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (r.description LIKE ? OR r.location_name LIKE ? OR r.id LIKE ? OR r.incident_id LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const reports = await queryAll(query, params);

    // Get total count for pagination
    const totalQuery = `SELECT count(*) as count FROM reports r WHERE 1=1`;
    const totalResult = await queryOne<{ count: number }>(totalQuery);

    return res.json({
      reports,
      total: totalResult?.count || reports.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    return res.status(500).json({ error: 'Internal server error while fetching reports.' });
  }
});

// GET /api/reports/:id - Fetch single report with all linked data
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await queryOne<any>(
      `SELECT r.*, u.name as reporter_name
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // Get Incident
    let incident = null;
    if (report.incident_id) {
      incident = await queryOne('SELECT * FROM incidents WHERE id = ?', [report.incident_id]);
    }

    // Get related/duplicate reports under same incident or via report_relations
    const relatedReports = await queryAll(
      `SELECT id, category, description, location_name, status, priority, image_url, created_at, is_duplicate
       FROM reports 
       WHERE (incident_id = ? OR id IN (
         SELECT related_report_id FROM report_relations WHERE report_id = ?
         UNION
         SELECT report_id FROM report_relations WHERE related_report_id = ?
       )) AND id != ?
       LIMIT 10`,
      [report.incident_id || '', id, id, id]
    );

    // Get status history
    const statusHistory = await queryAll(
      'SELECT * FROM status_history WHERE report_id = ? ORDER BY created_at ASC',
      [id]
    );

    // Get admin notes
    const adminNotes = await queryAll(
      'SELECT id, admin_name, note, created_at FROM admin_notes WHERE report_id = ? ORDER BY created_at DESC',
      [id]
    );

    return res.json({
      report,
      incident,
      relatedReports,
      statusHistory,
      adminNotes,
    });
  } catch (err: any) {
    console.error('Error fetching report detail:', err);
    return res.status(500).json({ error: 'Failed to retrieve report details.' });
  }
});

// PUT /api/reports/:id - Update report / upvote
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (action === 'upvote') {
      await runQuery('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?', [id]);
      const updated = await queryOne<{ upvotes: number }>('SELECT upvotes FROM reports WHERE id = ?', [id]);
      return res.json({ message: 'Upvoted successfully.', upvotes: updated?.upvotes || 0 });
    }

    return res.status(400).json({ error: 'Unsupported action.' });
  } catch (err: any) {
    console.error('Error updating report:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reports/:id/check-duplicates - Check duplicates for existing report
router.post('/:id/check-duplicates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const current = await queryOne<any>('SELECT * FROM reports WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const allReports = await queryAll<any>('SELECT * FROM reports WHERE id != ?', [id]);
    const check = detectDuplicates(
      {
        latitude: current.latitude,
        longitude: current.longitude,
        category: current.category,
        description: current.description,
      },
      allReports
    );

    return res.json({
      reportId: id,
      duplicateCheck: check,
    });
  } catch (err: any) {
    console.error('Duplicate check error:', err);
    return res.status(500).json({ error: 'Failed to check duplicates.' });
  }
});

// DELETE /api/reports/:id - Delete report (owner or admin only)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await queryOne<any>('SELECT user_id FROM reports WHERE id = ?', [id]);

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const isOwner = report.user_id === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this report.' });
    }

    // Delete child rows
    await runQuery('DELETE FROM report_relations WHERE report_id = ? OR related_report_id = ?', [id, id]);
    await runQuery('DELETE FROM status_history WHERE report_id = ?', [id]);
    await runQuery('DELETE FROM admin_notes WHERE report_id = ?', [id]);
    await runQuery('DELETE FROM reports WHERE id = ?', [id]);

    return res.json({ message: 'Report deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting report:', err);
    return res.status(500).json({ error: 'Failed to delete report.' });
  }
});

export default router;
