import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { analyzeRoadHazard } from '../ai/gemini.js';

const router = Router();

// POST /api/ai/analyze
// On-demand hazard analysis before final submission or for preview
router.post('/analyze', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, mimeType, description, userCategory } = req.body;

    if (!description && !image) {
      return res.status(400).json({ error: 'Please provide an image or description for analysis.' });
    }

    const analysis = await analyzeRoadHazard(
      image || null,
      mimeType || 'image/jpeg',
      description || '',
      userCategory
    );

    return res.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    console.error('AI analysis error:', err);
    return res.status(500).json({
      error: 'Failed to analyze road hazard. Please try again.',
    });
  }
});

export default router;
