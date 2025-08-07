/**
 * @file Defines API routes for discovering and managing HLS streams.
 * Note: The actual serving of .m3u8 and .ts files is handled by
 * the express.static middleware in src/index.ts.
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getAllLiveRooms, getLiveRoom, getRoomFromDb } from '../services/RoomService';

const router = Router();

/**
 * @route GET /api/streams
 * @description Gets a list of all currently active HLS streams.
 */
router.get('/streams', (req: Request, res: Response) => {
  try {
    // Get all rooms that are currently live in memory.
    const liveRooms = getAllLiveRooms();

    // Filter for rooms that have an active HLS process and transform to a public format.
    const activeStreams = liveRooms
      .filter(room => room.hlsProcess && room.router.appData.hlsUrl)
      .map(room => {
        const participants = Array.from(room.participants.values());
        return {
          id: room.id,
          title: room.router.appData.name || 'Live Stream',
          hlsUrl: room.router.appData.hlsUrl,
          isLive: true,
          // Count viewers and streamers for a total participant count
          participantCount: participants.length,
        };
      });

    res.status(200).json({ streams: activeStreams });
  } catch (error) {
    logger.error('Error getting HLS streams:', error);
    res.status(500).json({ message: 'Failed to get active streams.' });
  }
});

/**
 * @route GET /api/streams/:roomId
 * @description Gets detailed information for a single active HLS stream.
 */
router.get('/streams/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = getLiveRoom(roomId);

    // If the room isn't live or doesn't have an HLS stream, it's not found.
    if (!room || !room.hlsProcess || !room.router.appData.hlsUrl) {
      return res.status(404).json({ message: 'No active stream found for this room.' });
    }

    // Get the full room details from the database for extra info
    const dbRoom = await getRoomFromDb(roomId);
    const participants = Array.from(room.participants.values());

    res.status(200).json({
      id: room.id,
      title: dbRoom?.name || 'Live Stream',
      hlsUrl: room.router.appData.hlsUrl,
      isLive: true,
      participantCount: participants.length,
      // Provide a list of streamers (non-viewers)
      streamers: participants
        .filter(p => !p.isViewer)
        .map(p => p.toPlainObject()),
    });
  } catch (error) {
    logger.error(`Error getting HLS stream for room ${req.params.roomId}:`, error);
    res.status(500).json({ message: 'Failed to get stream details.' });
  }
});

export default router;