import pool from './connection';
import logger from '../utils/logger';

export async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);

    // Videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        duration FLOAT,
        fps INTEGER,
        resolution VARCHAR(20),
        codec VARCHAR(20),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);

    // Detections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS detections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id UUID NOT NULL REFERENCES videos(id),
        type VARCHAR(50),
        confidence FLOAT,
        x INTEGER,
        y INTEGER,
        width INTEGER,
        height INTEGER,
        start_frame INTEGER,
        end_frame INTEGER,
        is_moving BOOLEAN,
        tracking_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        video_id UUID NOT NULL REFERENCES videos(id),
        type VARCHAR(50),
        method VARCHAR(50),
        status VARCHAR(20),
        progress INTEGER DEFAULT 0,
        current_frame INTEGER,
        total_frames INTEGER,
        result_path TEXT,
        error_message TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Job regions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_regions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES jobs(id),
        x INTEGER,
        y INTEGER,
        width INTEGER,
        height INTEGER,
        start_frame INTEGER,
        end_frame INTEGER,
        removal_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    logger.info('Migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    logger.error('Migration error:', error);
    process.exit(1);
  });
}
