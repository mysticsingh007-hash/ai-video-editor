import pool from './connection';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export async function seedDatabase() {
  const client = await pool.connect();

  try {
    // Check if admin user exists
    const result = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin@12345', 10);
      await client.query(
        'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
        [uuidv4(), 'admin@example.com', hashedPassword, 'Admin User']
      );
      logger.info('Admin user created successfully');
    } else {
      logger.info('Admin user already exists');
    }
  } catch (error) {
    logger.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase().catch((error) => {
    logger.error('Seed error:', error);
    process.exit(1);
  });
}
