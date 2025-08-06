import { Socket, Server } from 'socket.io';
import { ParticipantService } from '../../services/ParticipantService';
import { RoomService } from '../../services/RoomService';
import { HLSService } from '../../services/HLSService';
import { logger } from '../../utils/logger';

const participantService = ParticipantService.getInstance();
const roomService = RoomService.getInstance();
const hlsService = HLSService.getInstance();

export function hlsHandler(socket: Socket, io: Server): void {
  socket.on('start-hls', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant || participant.roomId !== roomId || !participant.isHost) {
        socket.emit('error', {
          message: 'Only room host can start HLS recording',
          code: 'PERMISSION_DENIED',
        });
        return;
      }

      if (hlsService.isStreamActive(roomId)) {
        socket.emit('error', {
          message: 'HLS stream already active',
          code: 'HLS_ALREADY_ACTIVE',
        });
        return;
      }

      // For now, use a placeholder RTMP URL
      // In a real implementation, this would be connected to mediasoup plain transport
      const rtmpUrl = `rtmp://localhost:1935/live/${roomId}`;
      const playlistUrl = await hlsService.startHLSStream(roomId, rtmpUrl);

      await roomService.updateRoom(roomId, { hlsUrl: playlistUrl });

      // Notify all participants in the room
      io.to(roomId).emit('hls-started', {
        roomId,
        playlistUrl,
      });

      logger.info(`HLS recording started for room ${roomId} by participant ${participant.id}`);
    } catch (error) {
      logger.error('Error starting HLS recording:', error);
      socket.emit('error', {
        message: 'Failed to start HLS recording',
        code: 'HLS_START_ERROR',
      });
    }
  });

  socket.on('stop-hls', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant || participant.roomId !== roomId || !participant.isHost) {
        socket.emit('error', {
          message: 'Only room host can stop HLS recording',
          code: 'PERMISSION_DENIED',
        });
        return;
      }

      const success = hlsService.stopHLSStream(roomId);
      if (!success) {
        socket.emit('error', {
          message: 'No active HLS stream found',
          code: 'HLS_NOT_ACTIVE',
        });
        return;
      }

      await roomService.updateRoom(roomId, { hlsUrl: undefined });

      // Notify all participants in the room
      io.to(roomId).emit('hls-stopped', {
        roomId,
      });

      logger.info(`HLS recording stopped for room ${roomId} by participant ${participant.id}`);
    } catch (error) {
      logger.error('Error stopping HLS recording:', error);
      socket.emit('error', {
        message: 'Failed to stop HLS recording',
        code: 'HLS_STOP_ERROR',
      });
    }
  });

  socket.on('get-hls-status', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant || participant.roomId !== roomId) {
        socket.emit('error', {
          message: 'Not authorized to view HLS status',
          code: 'PERMISSION_DENIED',
        });
        return;
      }

      const room = await roomService.getRoomById(roomId);
      const isActive = hlsService.isStreamActive(roomId);

      socket.emit('hls-status', {
        roomId,
        isActive,
        playlistUrl: room?.hlsUrl,
      });
    } catch (error) {
      logger.error('Error getting HLS status:', error);
      socket.emit('error', {
        message: 'Failed to get HLS status',
        code: 'HLS_STATUS_ERROR',
      });
    }
  });
}
