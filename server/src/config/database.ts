import { PrismaClient, Prisma } from '@prisma/client';
import env from './environment';
import { logger } from '../utils/logger';

// Extend the NodeJS Global type to include our 'prisma' instance.
// This is necessary to store the Prisma client on the global object.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Creates and manages a singleton instance of the PrismaClient.
 *
 * In development, it caches the PrismaClient instance on the `globalThis` object.
 * This prevents creating a new database connection pool every time the server code
 * is hot-reloaded, avoiding potential connection limit issues.
 *
 * In production, it simply creates a new instance.
 *
 * @returns A singleton instance of PrismaClient.
 */
const createPrismaClient = (): PrismaClient => {
  const logLevels: Prisma.LogLevel[] = ['info', 'warn', 'error'];

  // Enable detailed query logging only in the development environment
  // for easier debugging without impacting production performance.
  if (env.NODE_ENV === 'development') {
    logLevels.push('query');
  }

  return new PrismaClient({
    log: logLevels,
  });
};

/**
 * A singleton PrismaClient instance to be used throughout the application.
 * It intelligently reuses a single connection pool.
 */
const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

// Cache the instance in development to avoid creating new connections on hot-reload.
if (env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Immediately attempt to connect to the database upon application startup.
// This adopts a "fail-fast" strategy. If the database is unavailable,
// the server will log the error and exit instead of running in a broken state.
prisma.$connect()
  .then(() => {
    logger.info('🐘 Connected to PostgreSQL database');
  })
  .catch((error: Error) => {
    logger.error('❌ Failed to connect to the database. Exiting.', error);
    process.exit(1);
  });

export default prisma;