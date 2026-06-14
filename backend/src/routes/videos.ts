import { Router, Response } from 'express';
import pool from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: process.env.UPLOAD_DIR || '/tmp/uploads',
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120'),
  },
});

// Upload video
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { title, description } = req.body;
    const videoId = uuidv4();

    // Extract video metadata using ffprobe
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,codec_name,duration',
      '-of', 'json',
      req.file.path,
    ]);

    const metadata = JSON.parse(stdout);
    const stream = metadata.streams[0];
    const [width, height] = [stream.width, stream.height];
    const fps = eval(stream.r_frame_rate);
    const duration = parseFloat(stream.duration);

    const result = await pool.query(
      `INSERT INTO videos 
       (id, user_id, title, description, filename, file_path, file_size, duration, fps, resolution, codec, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        videoId,
        req.userId,
        title || req.file.originalname,
        description,
        req.file.filename,
        req.file.path,
        req.file.size,
        duration,
        Math.round(fps),
        `${width}x${height}`,
        stream.codec_name,
        'uploaded',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get videos
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM videos WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM videos WHERE user_id = $1 AND deleted_at IS NULL',
      [req.userId]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get video
router.get('/:videoId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Delete video
router.delete('/:videoId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE videos SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
      [req.params.videoId, req.userId]
    );

    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router;
