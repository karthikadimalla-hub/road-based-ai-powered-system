import { Router, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../database/db.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin endpoints
router.use(requireAuth, requireAdmin);

// GET /api/admin/statistics - Comprehensive analytics
router.get('/statistics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalReports = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports'))?.count || 0;
    const newReports = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports WHERE status = "Reported"'))?.count || 0;
    const highPriority = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports WHERE priority = "high"'))?.count || 0;
    const criticalIssues = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports WHERE priority = "critical"'))?.count || 0;
    const resolvedIssues = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports WHERE status = "Resolved"'))?.count || 0;
    const inProgressIssues = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports WHERE status = "In Progress"'))?.count || 0;
    const assignedIssues = (await queryOne<{ count: number }>('SELECT count(*) as count FROM reports WHERE status = "Assigned"'))?.count || 0;
    const duplicateGroups = (await queryOne<{ count: number }>('SELECT count(*) as count FROM incidents WHERE report_count > 1'))?.count || 0;

    // By Category
    const byCategory = await queryAll<{ category: string; count: number }>(
      `SELECT category, count(*) as count FROM reports GROUP BY category ORDER BY count DESC`
    );

    // By Priority
    const byPriority = await queryAll<{ priority: string; count: number }>(
      `SELECT priority, count(*) as count FROM reports GROUP BY priority`
    );

    // By Status
    const byStatus = await queryAll<{ status: string; count: number }>(
      `SELECT status, count(*) as count FROM reports GROUP BY status`
    );

    // By City
    const byCity = await queryAll<{ city: string; count: number }>(
      `SELECT city, count(*) as count FROM reports GROUP BY city ORDER BY count DESC`
    );

    return res.json({
      summary: {
        totalReports,
        newReports,
        highPriority,
        criticalIssues,
        resolvedIssues,
        inProgressIssues,
        assignedIssues,
        duplicateGroups,
      },
      charts: {
        byCategory,
        byPriority,
        byStatus,
        byCity,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin statistics:', err);
    return res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

// GET /api/admin/reports - Query all reports with admin metadata
router.get('/reports', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority, category, search, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT r.*, u.name as reporter_name, u.email as reporter_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (priority && priority !== 'all') {
      sql += ' AND r.priority = ?';
      params.push(priority);
    }
    if (category && category !== 'all') {
      sql += ' AND r.category = ?';
      params.push(category);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      sql += ' AND (r.id LIKE ? OR r.description LIKE ? OR r.location_name LIKE ? OR r.city LIKE ? OR r.incident_id LIKE ?)';
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const reports = await queryAll(sql, params);
    return res.json({ reports });
  } catch (err: any) {
    console.error('Error fetching admin reports:', err);
    return res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// PUT /api/admin/reports/:id/status - Change report status
router.put('/reports/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const validStatuses = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const now = new Date().toISOString();
    await runQuery('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    // Record in status history
    await runQuery(
      `INSERT INTO status_history (id, report_id, status, changed_by, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `hist_${Date.now()}`,
        id,
        status,
        req.user?.name || 'Administrator',
        comment || `Status updated to ${status}.`,
        now,
      ]
    );

    // Also update incident status if applicable
    const report = await queryOne<{ incident_id: string }>('SELECT incident_id FROM reports WHERE id = ?', [id]);
    if (report?.incident_id) {
      await runQuery('UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?', [status, now, report.incident_id]);
    }

    return res.json({ message: `Status updated to ${status}.`, status });
  } catch (err: any) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// PUT /api/admin/reports/:id/priority - Change priority
router.put('/reports/:id/priority', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority, reasoning } = req.body;

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    }

    const now = new Date().toISOString();
    const updateReason = reasoning || `Priority manually calibrated to ${priority.toUpperCase()} by Safety Inspector.`;

    await runQuery(
      'UPDATE reports SET priority = ?, priority_reasoning = ?, updated_at = ? WHERE id = ?',
      [priority, updateReason, now, id]
    );

    return res.json({ message: `Priority updated to ${priority}.`, priority });
  } catch (err: any) {
    console.error('Error updating priority:', err);
    return res.status(500).json({ error: 'Failed to update priority.' });
  }
});

// POST /api/admin/reports/:id/notes - Add administrative note
router.post('/reports/:id/notes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ error: 'Note content cannot be empty.' });
    }

    const noteId = `note_${Date.now()}`;
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO admin_notes (id, admin_id, report_id, admin_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [noteId, req.user!.userId, id, req.user!.name, note.trim(), now]
    );

    const saved = await queryOne('SELECT * FROM admin_notes WHERE id = ?', [noteId]);
    return res.status(201).json({ message: 'Note added successfully.', note: saved });
  } catch (err: any) {
    console.error('Error adding admin note:', err);
    return res.status(500).json({ error: 'Failed to save admin note.' });
  }
});

// POST /api/admin/reports/:id/assign - Assign department / agency
router.post('/reports/:id/assign', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo || assignedTo.trim().length === 0) {
      return res.status(400).json({ error: 'Assignment field cannot be empty.' });
    }

    const now = new Date().toISOString();
    await runQuery('UPDATE reports SET assigned_to = ?, status = "Assigned", updated_at = ? WHERE id = ?', [
      assignedTo.trim(),
      now,
      id,
    ]);

    await runQuery(
      `INSERT INTO status_history (id, report_id, status, changed_by, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `hist_${Date.now()}`,
        id,
        'Assigned',
        req.user?.name || 'Administrator',
        `Assigned to ${assignedTo.trim()}.`,
        now,
      ]
    );

    return res.json({ message: `Assigned to ${assignedTo.trim()}.`, assignedTo });
  } catch (err: any) {
    console.error('Error assigning report:', err);
    return res.status(500).json({ error: 'Failed to assign report.' });
  }
});

// POST /api/admin/reports/:id/merge - Merge into existing incident
router.post('/reports/:id/merge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetIncidentId, targetReportId } = req.body;

    if (!targetIncidentId && !targetReportId) {
      return res.status(400).json({ error: 'Please specify target incident or target report to merge into.' });
    }

    let finalIncidentId = targetIncidentId;
    if (!finalIncidentId && targetReportId) {
      const targetRep = await queryOne<{ incident_id: string }>('SELECT incident_id FROM reports WHERE id = ?', [targetReportId]);
      finalIncidentId = targetRep?.incident_id;
    }

    if (!finalIncidentId) {
      return res.status(400).json({ error: 'Could not find target incident.' });
    }

    const now = new Date().toISOString();
    await runQuery(
      'UPDATE reports SET incident_id = ?, is_duplicate = 1, duplicate_of_report_id = ?, updated_at = ? WHERE id = ?',
      [finalIncidentId, targetReportId || null, now, id]
    );

    await runQuery(
      'UPDATE incidents SET report_count = report_count + 1, updated_at = ? WHERE id = ?',
      [now, finalIncidentId]
    );

    if (targetReportId) {
      await runQuery(
        `INSERT INTO report_relations (id, report_id, related_report_id, relation_type, distance_meters, similarity_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`rel_${Date.now()}`, id, targetReportId, 'manual_merge', 50, 0.9, now]
      );
    }

    return res.json({ message: `Successfully merged into Incident ${finalIncidentId}.` });
  } catch (err: any) {
    console.error('Error merging reports:', err);
    return res.status(500).json({ error: 'Failed to merge reports.' });
  }
});

export default router;
