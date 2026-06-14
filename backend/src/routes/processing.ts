import { Router, Response } from 'express';
import pool from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Start processing job
router.post('/:videoId/process', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const { regions, method, quality, format } = req.body;

    // Verify video ownership
    const videoResult = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, req.userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const jobId = uuidv4();
    const videoData = videoResult.rows[0];

    const result = await pool.query(
      `INSERT INTO jobs (id, user_id, video_id, type, method, status, progress, total_frames)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        jobId,
        req.userId,
        videoId,
        'processing',
        method,
        'pending',
        0,
        Math.round(videoData.duration * videoData.fps),
      ]
    );

    // Store regions
    for (const region of regions) {
      await pool.query(
        `INSERT INTO job_regions (id, job_id, x, y, width, height, start_frame, end_frame, removal_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuidv4(),
          jobId,
          region.x,
          region.y,
          region.width,
          region.height,
          region.startFrame,
          region.endFrame,
          method,
        ]
      );
    }

    // TODO: Queue processing job

    res.status(202).json(result.rows[0]);
  } catch (error: any) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Processing job failed' });
  }
});

// Get job status
router.get('/jobs/:jobId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [req.params.jobId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Cancel job
router.post('/jobs/:jobId/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE jobs SET status = $1 WHERE id = $2 AND user_id = $3',
      ['cancelled', req.params.jobId, req.userId]
    );

    res.json({ message: 'Job cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

export default router;
