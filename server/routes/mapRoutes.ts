import { Router, Response } from 'express';
import { queryAll } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/map/reports and GET /api/map - Public GIS endpoints for Leaflet / OpenStreetMap
const getMapReportsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, priority, status, city } = req.query;

    let sql = `
      SELECT 
        id, incident_id, category, latitude, longitude,
        priority, priority_score, status, location_name, city,
        image_url, description, upvotes, created_at
      FROM reports
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (priority && priority !== 'all') {
      sql += ' AND priority = ?';
      params.push(priority);
    }
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (city && city !== 'all') {
      sql += ' AND city = ?';
      params.push(city);
    }

    sql += ' ORDER BY created_at DESC LIMIT 300';

    const points = await queryAll(sql, params);
    return res.json({ reports: points });
  } catch (err: any) {
    console.error('Error fetching map points:', err);
    return res.status(500).json({ error: 'Failed to retrieve map markers.' });
  }
};

router.get('/reports', getMapReportsHandler);
router.get('/', getMapReportsHandler);

export default router;
