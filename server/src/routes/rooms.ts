import { Router, Request, Response } from 'express';
import { RoomService } from '../services/RoomService';
import { createRoomSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const router = Router();
const roomService = RoomService.getInstance();

// GET /api/rooms - Get all rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.json({
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        isActive: room.isActive,
        participantCount: room.participantCount,
        createdAt: room.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Error getting rooms:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get rooms',
    });
  }
});

// POST /api/rooms - Create a new room
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = createRoomSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const room = await roomService.createRoom(validationResult.data);
    res.status(201).json({
      id: room.id,
      name: room.name,
      isActive: room.isActive,
      participantCount: room.participantCount,
      createdAt: room.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error creating room:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create room',
    });
  }
});

// GET /api/rooms/:roomId - Get room details
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Room not found',
      });
    }

    res.json({
      id: room.id,
      name: room.name,
      isActive: room.isActive,
      participantCount: room.participantCount,
      hlsUrl: room.hlsUrl,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error getting room:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get room',
    });
  }
});

// DELETE /api/rooms/:roomId - Delete room
router.delete('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const success = await roomService.deleteRoom(roomId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Room not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting room:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete room',
    });
  }
});

export default router;
