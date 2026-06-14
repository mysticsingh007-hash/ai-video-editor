import { Router, Response } from 'express';
import pool from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Start detection job
router.post('/:videoId/detect', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const { detectionTypes, sensitivity } = req.body;

    // Verify video ownership
    const videoResult = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, req.userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const jobId = uuidv4();

    const result = await pool.query(
      `INSERT INTO jobs (id, user_id, video_id, type, status, progress)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [jobId, req.userId, videoId, 'detection', 'pending', 0]
    );

    // TODO: Queue detection job

    res.status(202).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Detection job failed' });
  }
});

// Get detections
router.get('/:videoId/detections', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM detections WHERE video_id = $1 ORDER BY created_at DESC',
      [req.params.videoId]
    );

    res.json({
      videoId: req.params.videoId,
      detections: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch detections' });
  }
});

export default router;
