import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from the .env file in the root directory
dotenv.config();

/**
 * Defines the schema for environment variables using Zod.
 * This ensures that all required environment variables are present and correctly typed.
 */
const envSchema = z.object({
  /**
   * The runtime environment of the application.
   * @default 'development'
   */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  /**
   * The port number on which the HTTP and Socket.IO server will listen.
   * @default 3001
   */
  PORT: z.string().transform(Number).default('3001'),

  /**
   * The connection string for the PostgreSQL database used by Prisma.
   * Example: "postgresql://user:password@localhost:5432/mydatabase"
   */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required.'),

  /**
   * The connection string for the Redis server.
   * Optional, but can be used for caching or scaling Socket.IO across multiple server instances.
   */
  REDIS_URL: z.string().optional(),

  /**
   * The IP address that Mediasoup will bind to on the server.
   * '127.0.0.1' is for local development. Use '0.0.0.0' in production to listen on all available network interfaces.
   * @default '127.0.0.1'
   */
  MEDIASOUP_LISTEN_IP: z.string().ip().default('127.0.0.1'),

  /**
   * The public IP address of the server that is announced to clients.
   * This MUST be the server's public IP address in a production environment so clients know where to connect.
   * @default '127.0.0.1'
   */
  MEDIASOUP_ANNOUNCED_IP: z.string().ip().default('127.0.0.1'),

  /**
   * The starting port in the range used by Mediasoup for WebRTC media traffic (RTP/RTCP).
   * @default 40000
   */
  MEDIASOUP_MIN_PORT: z.string().transform(Number).default('40000'),

  /**
   * The ending port in the range used by Mediasoup for WebRTC media traffic (RTP/RTCP).
   * @default 49999
   */
  MEDIASOUP_MAX_PORT: z.string().transform(Number).default('49999'),

  /**
   * The file system path where HLS (.m3u8, .ts) files will be stored.
   * @default './storage/hls'
   */
  HLS_STORAGE_PATH: z.string().default('./storage/hls'),

  /**
   * The path to the FFmpeg executable binary.
   * FFmpeg is required for converting WebRTC streams to HLS.
   * @default '/usr/bin/ffmpeg'
   */
  FFMPEG_PATH: z.string().default('/usr/bin/ffmpeg'),

  /**
   * A comma-separated list of allowed origins for CORS (Cross-Origin Resource Sharing).
   * This is a security measure to control which frontend URLs can access the API.
   * Default includes both localhost and 127.0.0.1 to match common dev setups.
   * @default 'http://localhost:3000,http://127.0.0.1:3000'
   */
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),

  /**
   * Force Mediasoup WebRTC transports to use TCP only. Helpful on Windows/dev when UDP is blocked.
   */
  MEDIASOUP_FORCE_TCP: z.string().optional(),
});

/**
 * A validated and typed object containing all environment variables for the application.
 * If any required variables are missing or have the wrong type, the application will throw an error on startup.
 */
const env = envSchema.parse(process.env);

export default env;