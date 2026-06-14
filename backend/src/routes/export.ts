import { Router, Response } from 'express';
import pool from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// Download processed video
router.get('/:videoId/download', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const { jobId } = req.query;

    // Verify ownership
    const videoResult = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, req.userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get job and result path
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [jobId, req.userId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job is not completed' });
    }

    if (!job.result_path || !fs.existsSync(job.result_path)) {
      return res.status(404).json({ error: 'Result file not found' });
    }

    // Stream file
    res.setHeader('Content-Disposition', `attachment; filename="processed_${videoResult.rows[0].title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const fileStream = fs.createReadStream(job.result_path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      res.status(500).json({ error: 'Download failed' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download video' });
  }
});

// Stream video preview
router.get('/:videoId/stream', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;

    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = result.rows[0];
    const filePath = video.file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileSize = fs.statSync(filePath).size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'video/mp4',
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Get export formats
router.get('/:videoId/export-formats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      formats: [
        {
          format: 'mp4',
          codec: 'h264',
          preset: 'fast',
          estimatedTime: 120,
        },
        {
          format: 'mp4',
          codec: 'h265',
          preset: 'medium',
          estimatedTime: 180,
        },
        {
          format: 'webm',
          codec: 'vp9',
          preset: 'slow',
          estimatedTime: 300,
        },
        {
          format: 'mov',
          codec: 'prores',
          preset: 'medium',
          estimatedTime: 250,
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch export formats' });
  }
});

export default router;
