import { Socket, Server } from 'socket.io';
import { RoomService } from '../../services/RoomService';
import { logger } from '../../utils/logger';
import { joinRoomSchema } from '../../utils/validation';

const roomService = RoomService.getInstance();

export function viewerHandler(socket: Socket, io: Server): void {
  socket.on('join-as-viewer', async (data: { roomId: string }) => {
    try {
      const validationResult = joinRoomSchema.safeParse(data);
      if (!validationResult.success) {
        socket.emit('error', {
          message: 'Invalid room ID',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const { roomId } = validationResult.data;
      
      // Get room (viewers don't create rooms, only join existing ones)
      const room = await roomService.getRoomById(roomId);
      if (!room) {
        socket.emit('error', {
          message: 'Room not found',
          code: 'ROOM_NOT_FOUND',
        });
        return;
      }

      // Join socket room as viewer
      socket.join(`${roomId}-viewers`);

      // Send viewer-joined event
      socket.emit('viewer-joined', {
        roomId,
        isViewer: true,
      });

      logger.info(`Viewer joined room ${roomId} as viewer`);
    } catch (error) {
      logger.error('Error in join-as-viewer handler:', error);
      socket.emit('error', {
        message: 'Failed to join room as viewer',
        code: 'JOIN_VIEWER_ERROR',
      });
    }
  });

  socket.on('leave-viewer', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      
      // Leave socket room
      socket.leave(`${roomId}-viewers`);

      logger.info(`Viewer left room ${roomId}`);
    } catch (error) {
      logger.error('Error in leave-viewer handler:', error);
    }
  });
}
