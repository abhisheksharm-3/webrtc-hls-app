import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  MEDIASOUP_LISTEN_IP: z.string().default('127.0.0.1'),
  MEDIASOUP_ANNOUNCED_IP: z.string().default('127.0.0.1'),
  MEDIASOUP_MIN_PORT: z.string().transform(Number).default('40000'),
  MEDIASOUP_MAX_PORT: z.string().transform(Number).default('49999'),
  HLS_STORAGE_PATH: z.string().default('./storage/hls'),
  FFMPEG_PATH: z.string().default('/usr/bin/ffmpeg'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

const env = envSchema.parse(process.env);

export default env;
