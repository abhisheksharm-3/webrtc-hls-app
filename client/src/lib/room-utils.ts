/**
 * Generates a user-friendly, random room ID in the format 'xxx-xxx-xxx'.
 * @returns {string} The generated room ID.
 */
export const generateRoomId = () => {
  const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const SEGMENT_LENGTH = 3;
  const NUM_SEGMENTS = 3;

  const createSegment = () =>
    Array.from({ length: SEGMENT_LENGTH }, () =>
      ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length))
    ).join('');

  return Array.from({ length: NUM_SEGMENTS }, createSegment).join('-');
};