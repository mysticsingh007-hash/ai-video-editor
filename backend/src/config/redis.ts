import redis from 'redis';
import logger from '../utils/logger';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export async function initializeRedis() {
  await redisClient.connect();
}

export default redisClient;
