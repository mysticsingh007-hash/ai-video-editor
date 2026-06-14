import { execFile } from 'child_process';
import { promisify } from 'util';
import logger from '../utils/logger';
import { Job } from 'bull';
import pool from '../database/connection';

const execFileAsync = promisify(execFile);

export async function removeLogoFromVideo(
  inputPath: string,
  outputPath: string,
  regions: any[],
  method: string,
  job?: Job
) {
  try {
    logger.info(`Removing logos from ${inputPath} using ${method}`);

    // Get video info
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate,duration',
      '-of', 'json',
      inputPath,
    ]);

    const metadata = JSON.parse(stdout);
    const stream = metadata.streams[0];
    const fps = eval(stream.r_frame_rate);
    const duration = parseFloat(stream.duration);
    const totalFrames = Math.round(duration * fps);

    logger.info(`Video info - Duration: ${duration}s, FPS: ${fps}, Total frames: ${totalFrames}`);

    // Create filter complex based on method
    let filterComplex = '';

    switch (method) {
      case 'blur':
        filterComplex = buildBlurFilter(regions);
        break;
      case 'pixelate':
        filterComplex = buildPixelFilter(regions);
        break;
      case 'inpaint':
        // For inpainting, would need a Python backend or specialized library
        filterComplex = buildBlurFilter(regions); // Fallback to blur
        break;
      default:
        filterComplex = buildBlurFilter(regions);
    }

    logger.info(`Filter complex: ${filterComplex}`);

    // FFmpeg command to process video
    const ffmpegArgs = [
      '-i', inputPath,
      '-vf', filterComplex,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      outputPath,
    ];

    // Execute FFmpeg with progress tracking
    await new Promise((resolve, reject) => {
      const process = require('child_process').spawn('ffmpeg', ffmpegArgs);

      process.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        const match = output.match(/frame=\s*(\d+)/);
        if (match && job) {
          const currentFrame = parseInt(match[1]);
          const progress = Math.round((currentFrame / totalFrames) * 100);
          job.progress(progress);
        }
      });

      process.on('close', (code: number) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      process.on('error', (error: Error) => {
        reject(error);
      });
    });

    logger.info(`Video processing completed: ${outputPath}`);
  } catch (error) {
    logger.error('Video removal error:', error);
    throw error;
  }
}

function buildBlurFilter(regions: any[]): string {
  if (regions.length === 0) return 'copy';

  const filters = regions.map((region, idx) => {
    const { x, y, width, height } = region;
    return `[0:v]crop=w=${width}:h=${height}:x=${x}:y=${y}[region${idx}];[region${idx}]boxblur=luma_radius=min(h\\,w)/10:luma_power=1[blurred${idx}]`;
  });

  return filters.join(';');
}

function buildPixelFilter(regions: any[]): string {
  if (regions.length === 0) return 'copy';

  // Build pixelate filter for each region
  let filterStr = '[0:v]';
  regions.forEach((region, idx) => {
    const { x, y, width, height } = region;
    filterStr += `scale=${Math.max(1, Math.round(width / 10))}:${Math.max(1, Math.round(height / 10))},scale=${width}:${height}`;
  });

  return filterStr;
}
