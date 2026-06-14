import pool from '../database/connection';
import logger from '../utils/logger';

export async function updateJobProgress(jobId: string, progress: number, currentFrame?: number) {
  try {
    await pool.query(
      'UPDATE jobs SET progress = $1, current_frame = $2 WHERE id = $3',
      [progress, currentFrame, jobId]
    );
  } catch (error) {
    logger.error('Failed to update job progress:', error);
  }
}

export async function updateJobStatus(jobId: string, status: string, errorMessage?: string) {
  try {
    if (errorMessage) {
      await pool.query(
        'UPDATE jobs SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        [status, errorMessage, jobId]
      );
    } else {
      await pool.query(
        'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, jobId]
      );
    }
  } catch (error) {
    logger.error('Failed to update job status:', error);
  }
}

export async function getJobDetails(jobId: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      throw new Error('Job not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get job details:', error);
    throw error;
  }
}

export async function getJobRegions(jobId: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM job_regions WHERE job_id = $1',
      [jobId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Failed to get job regions:', error);
    throw error;
  }
}
