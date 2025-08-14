"use server"
/**
 * @file URL utility functions for the application.
 */

/**
 * Generates the HLS playlist URL from a room ID.
 * @param {string | null} roomId - The room ID.
 * @returns {string | null} The full HLS URL or null if no room ID is provided.
 */
export const getHlsUrl = async (roomId: string | null): Promise<string | null> => {
  if (!roomId) return null;

  // Fallback ensures the URL is constructed even if env variables are missing during development.
  const hlsBase = (
    process.env.HLS_BASE_URL ||
    `${process.env.SERVER_URL || 'http://localhost:3001'}/hls`
  ).replace(/\/$/, ''); // Removes trailing slash if present

  return `${hlsBase}/${roomId}/playlist.m3u8`;
};