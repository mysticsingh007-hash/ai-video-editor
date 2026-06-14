import { Job } from 'bull';
import pool from '../database/connection';
import { detectLogos, detectWatermarks, detectTimestamps } from '../detection/detectors';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function processDetectionJob(job: Job) {
  const { videoId, detectionTypes, sensitivity } = job.data;

  try {
    // Get video info
    const videoResult = await pool.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );

    if (videoResult.rows.length === 0) {
      throw new Error('Video not found');
    }

    const video = videoResult.rows[0];
    const detections: any[] = [];

    // Run detections based on types
    if (detectionTypes.includes('logo')) {
      logger.info(`Detecting logos in video ${videoId}`);
      const logoDetections = await detectLogos(video.file_path, sensitivity);
      detections.push(...logoDetections);
    }

    if (detectionTypes.includes('watermark')) {
      logger.info(`Detecting watermarks in video ${videoId}`);
      const watermarkDetections = await detectWatermarks(video.file_path, sensitivity);
      detections.push(...watermarkDetections);
    }

    if (detectionTypes.includes('timestamp')) {
      logger.info(`Detecting timestamps in video ${videoId}`);
      const timestampDetections = await detectTimestamps(video.file_path);
      detections.push(...timestampDetections);
    }

    // Store detections in database
    for (const detection of detections) {
      await pool.query(
        `INSERT INTO detections (id, video_id, type, confidence, x, y, width, height, start_frame, end_frame, is_moving)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          uuidv4(),
          videoId,
          detection.type,
          detection.confidence,
          detection.x,
          detection.y,
          detection.width,
          detection.height,
          detection.startFrame,
          detection.endFrame,
          detection.isMoving,
        ]
      );
    }

    // Update job status
    await pool.query(
      'UPDATE jobs SET status = $1, progress = $2, completed_at = NOW() WHERE id = $3',
      ['completed', 100, job.data.jobId]
    );

    logger.info(`Detection completed for video ${videoId}, found ${detections.length} objects`);
    return { detections: detections.length };
  } catch (error: any) {
    logger.error(`Detection job failed: ${error.message}`);
    await pool.query(
      'UPDATE jobs SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, job.data.jobId]
    );
    throw error;
  }
}
