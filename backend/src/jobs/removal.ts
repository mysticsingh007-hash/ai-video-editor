import { Job } from 'bull';
import pool from '../database/connection';
import logger from '../utils/logger';
import { removeLogoFromVideo } from '../processors/removal';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function processVideoRemovalJob(job: Job) {
  const { videoId, jobId, regions, method, format, quality } = job.data;

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
    const outputDir = process.env.PROCESSED_DIR || '/tmp/processed';
    const outputFilename = `${uuidv4()}.${format || 'mp4'}`;
    const outputPath = path.join(outputDir, outputFilename);

    logger.info(`Starting video processing: ${videoId} using ${method}`);

    // Process video based on method
    switch (method) {
      case 'blur':
        await removeLogoFromVideo(video.file_path, outputPath, regions, 'blur', job);
        break;
      case 'inpaint':
        await removeLogoFromVideo(video.file_path, outputPath, regions, 'inpaint', job);
        break;
      case 'interpolation':
        await removeLogoFromVideo(video.file_path, outputPath, regions, 'interpolation', job);
        break;
      case 'pixel':
        await removeLogoFromVideo(video.file_path, outputPath, regions, 'pixel', job);
        break;
      default:
        throw new Error(`Unknown removal method: ${method}`);
    }

    // Update job with result
    await pool.query(
      'UPDATE jobs SET status = $1, progress = $2, result_path = $3, completed_at = NOW() WHERE id = $4',
      ['completed', 100, outputPath, jobId]
    );

    logger.info(`Video processing completed: ${videoId}`);
    return { outputPath, outputFilename };
  } catch (error: any) {
    logger.error(`Video processing failed: ${error.message}`);
    await pool.query(
      'UPDATE jobs SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, jobId]
    );
    throw error;
  }
}
