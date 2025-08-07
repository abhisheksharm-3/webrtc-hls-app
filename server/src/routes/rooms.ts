/**
 * @file Defines API routes for room management (CRUD).
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { closeRoom, findOrCreateLiveRoom, getAllRoomsFromDb, getRoomFromDb } from '../services/RoomService';
// import { createRoomSchema } from '../utils/validation';

const router = Router();

/**
 * @route GET /api/rooms
 * @description Retrieves a list of all rooms from the database.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await getAllRoomsFromDb(); // A new function we'd add
    res.status(200).json({ rooms });
  } catch (error) {
    logger.error('Error getting rooms:', error);
    res.status(500).json({ message: 'Failed to get rooms.' });
  }
});

/**
 * @route POST /api/rooms
 * @description Creates a new room, making it "live" and ready for participants.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // const { name } = createRoomSchema.parse(req.body);
    const { name } = req.body;

    // This service function now handles creating the DB record AND the live Mediasoup router.
    const liveRoom = await findOrCreateLiveRoom(name);

    if (!liveRoom) {
      return res.status(500).json({ message: 'Failed to create live room.' });
    }

    const dbRoom = await getRoomFromDb(liveRoom.id);

    if (!dbRoom) {
      return res.status(500).json({ message: 'Failed to load room data from database.' });
    }

    // Return a plain data object representing the new room.
    res.status(201).json(liveRoom.toPlainObject(dbRoom));

  } catch (error) {
    logger.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room.' });
  }
});

/**
 * @route GET /api/rooms/:roomId
 * @description Gets details for a specific room from the database.
 */
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await getRoomFromDb(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    res.status(200).json(room);
  } catch (error) {
    logger.error(`Error getting room ${req.params.roomId}:`, error);
    res.status(500).json({ message: 'Failed to get room details.' });
  }
});

/**
 * @route DELETE /api/rooms/:roomId
 * @description Closes a live room session and marks it as inactive.
 */
router.delete('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    // This service function now handles closing Mediasoup resources AND updating the DB.
    await closeRoom(roomId);
    
    res.status(204).send(); // 204 No Content is standard for a successful DELETE.
  } catch (error) {
    logger.error(`Error deleting room ${req.params.roomId}:`, error);
    res.status(500).json({ message: 'Failed to delete room.' });
  }
});

export default router;