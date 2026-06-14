import Queue from 'bull';
import redis from '../config/redis';
import logger from '../utils/logger';
import { processDetectionJob } from './detection';
import { processVideoRemovalJob } from './removal';

const detectionQueue = new Queue('detection', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const processingQueue = new Queue('processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Detection job processor
detectionQueue.process(async (job) => {
  logger.info(`Processing detection job: ${job.id}`);
  return processDetectionJob(job);
});

// Processing job processor
processingQueue.process(async (job) => {
  logger.info(`Processing video job: ${job.id}`);
  return processVideoRemovalJob(job);
});

// Job event handlers
detectionQueue.on('completed', (job) => {
  logger.info(`Detection job completed: ${job.id}`);
});

detectionQueue.on('failed', (job, err) => {
  logger.error(`Detection job failed: ${job.id}`, err);
});

processingQueue.on('completed', (job) => {
  logger.info(`Processing job completed: ${job.id}`);
});

processingQueue.on('failed', (job, err) => {
  logger.error(`Processing job failed: ${job.id}`, err);
});

export { detectionQueue, processingQueue };
