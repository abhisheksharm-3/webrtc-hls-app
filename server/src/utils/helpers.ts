import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique, random Version 4 UUID.
 * @returns A string representing the new UUID (e.g., "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d").
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Pauses execution for a specified number of milliseconds.
 * Useful for debugging, simulating network latency, or waiting for an operation.
 * @example await sleep(1000); // Pauses for 1 second
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified duration.
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Sanitizes a string to be safely used as a filename.
 * It replaces all non-alphanumeric characters with an underscore.
 * @example sanitizeFilename("My Cool Room!*#") // Returns "my_cool_room___"
 * @param filename - The input string to sanitize.
 * @returns The sanitized, lowercase string.
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
};

/**
 * Converts a number of bytes into a human-readable string format (KB, MB, GB, etc.).
 * @example formatBytes(1024) // Returns "1.00 KB"
 * @param bytes - The number of bytes to format.
 * @param decimals - The number of decimal places to include in the output. Defaults to 2.
 * @returns A formatted string representing the file size.
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};