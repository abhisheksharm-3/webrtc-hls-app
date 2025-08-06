import { Socket, Server } from 'socket.io';
import { RoomService } from '../../services/RoomService';
import { ParticipantService } from '../../services/ParticipantService';
import { MediasoupRouter } from '../../mediasoup/router';
import { logger } from '../../utils/logger';
import { joinRoomSchema } from '../../utils/validation';

const roomService = RoomService.getInstance();
const participantService = ParticipantService.getInstance();
const mediasoupRouter = MediasoupRouter.getInstance();

export function roomHandler(socket: Socket, io: Server): void {
  socket.on('join-room', async (data: { roomId: string; role?: 'host' | 'guest' | 'viewer' }) => {
    try {
      const validationResult = joinRoomSchema.safeParse(data);
      if (!validationResult.success) {
        socket.emit('error', {
          message: 'Invalid room ID',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const { roomId, role } = data;
      
      // Get or create room with the provided roomId
      let room = await roomService.getRoomById(roomId);
      if (!room) {
        // Create room with the specific roomId (not auto-generated)
        room = await roomService.createRoomWithId(roomId, { name: `Podcast Room ${roomId}` });
      }

      const existingParticipants = await participantService.getParticipantsByRoomId(roomId);
      const activeStreamers = existingParticipants.filter(p => p.isHost || (!p.isHost && existingParticipants.some(h => h.isHost)));
      
      // Determine user role
      let isHost = false;
      let isViewer = false;
      
      if (role === 'viewer') {
        isViewer = true;
      } else if (role === 'host' || existingParticipants.length === 0) {
        // First person to join becomes host, or explicit host role
        isHost = true;
        if (activeStreamers.filter(p => p.isHost).length > 0) {
          socket.emit('error', {
            message: 'This room already has a host. Join as guest or viewer.',
            code: 'HOST_EXISTS',
          });
          return;
        }
      } else {
        // Guest role
        if (activeStreamers.length >= 2) {
          socket.emit('error', {
            message: 'Room is full. Only 2 participants allowed (host + guest). You can join as a viewer.',
            code: 'ROOM_FULL',
          });
          return;
        }
      }

      // Create router for room if not exists (only needed for WebRTC participants)
      if (!isViewer && !room.router) {
        room.router = await mediasoupRouter.createRouter(roomId);
        roomService.setMemoryRoom(room);
      }

      // Create participant
      const participant = await participantService.createParticipant({
        roomId,
        socketId: socket.id,
        isHost,
        isViewer,
      });

      // Join socket room
      socket.join(roomId);

      // Update room participant count
      await participantService.updateRoomParticipantCount(roomId);

      // Add participant to memory room (only if not viewer)
      if (!isViewer && room.participants) {
        room.participants.set(participant.id, {
          ...participant,
          transports: new Map(),
          producers: new Map(),
          consumers: new Map(),
        });
      }

      // Get all participants for response
      const allParticipants = await participantService.getParticipantsByRoomId(roomId);
      
      // Format participants for client
      const formattedParticipants = allParticipants.map(p => ({
        id: p.id,
        isHost: p.isHost,
        isViewer: p.isViewer || false,
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio,
        isStreaming: p.isStreaming,
      }));

      // Send room-joined event to the joining participant
      socket.emit('room-joined', {
        roomId,
        participants: formattedParticipants,
        routerRtpCapabilities: room.router?.rtpCapabilities || null,
        isHost,
        isViewer,
        userRole: isHost ? 'host' : isViewer ? 'viewer' : 'guest',
      });

      // Notify existing participants about the new participant
      socket.to(roomId).emit('participant-joined', {
        participant: {
          id: participant.id,
          isHost: participant.isHost,
          hasVideo: participant.hasVideo,
          hasAudio: participant.hasAudio,
          isStreaming: participant.isStreaming,
        },
      });

      logger.info(`Participant ${participant.id} joined room ${roomId} as ${isHost ? 'host' : 'guest'}`);
      
      // If this is the second participant (guest), notify about existing producers
      if (!isHost && room.participants.size > 1) {
        // Find existing participants and their producers
        for (const [participantId, memoryParticipant] of room.participants) {
          if (participantId !== participant.id && memoryParticipant.producers.size > 0) {
            // Notify about existing producers
            memoryParticipant.producers.forEach((producer) => {
              socket.emit('new-producer', {
                producerId: producer.id,
                participantId,
                kind: producer.kind,
              });
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error in join-room handler:', error);
      socket.emit('error', {
        message: 'Failed to join room',
        code: 'JOIN_ROOM_ERROR',
      });
    }
  });

  socket.on('start-streaming', async (data: { roomId: string }) => {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) {
        socket.emit('error', {
          message: 'Participant not found',
          code: 'PARTICIPANT_NOT_FOUND',
        });
        return;
      }

      // Update participant streaming status
      await participantService.updateParticipant(participant.id, {
        isStreaming: true,
      });

      // Notify others in the room
      socket.to(participant.roomId).emit('participant-started-streaming', {
        participantId: participant.id,
      });

      logger.info(`Participant ${participant.id} started streaming in room ${participant.roomId}`);
    } catch (error) {
      logger.error('Error in start-streaming handler:', error);
    }
  });

  socket.on('stop-streaming', async (data: { roomId: string }) => {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) return;

      // Update participant streaming status
      await participantService.updateParticipant(participant.id, {
        isStreaming: false,
        hasVideo: false,
        hasAudio: false,
      });

      // Close all producers for this participant
      const room = roomService.getMemoryRoom(participant.roomId);
      const memoryParticipant = room?.participants.get(participant.id);
      if (memoryParticipant) {
        memoryParticipant.producers.forEach((producer) => {
          producer.close();
          // Notify others about closed producer
          socket.to(participant.roomId).emit('producer-closed', {
            producerId: producer.id,
            participantId: participant.id,
          });
        });
        memoryParticipant.producers.clear();
      }

      // Notify others in the room
      socket.to(participant.roomId).emit('participant-stopped-streaming', {
        participantId: participant.id,
      });

      logger.info(`Participant ${participant.id} stopped streaming in room ${participant.roomId}`);
    } catch (error) {
      logger.error('Error in stop-streaming handler:', error);
    }
  });

  socket.on('leave-room', async () => {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) return;

      const { roomId } = participant;

      // Close all transports, producers, and consumers
      const room = roomService.getMemoryRoom(roomId);
      const memoryParticipant = room?.participants.get(participant.id);
      if (memoryParticipant) {
        // Close producers
        memoryParticipant.producers.forEach((producer) => {
          producer.close();
          socket.to(roomId).emit('producer-closed', {
            producerId: producer.id,
            participantId: participant.id,
          });
        });

        // Close consumers
        memoryParticipant.consumers.forEach((consumer) => {
          consumer.close();
        });

        // Close transports
        memoryParticipant.transports.forEach((transport) => {
          transport.close();
        });
      }

      // Remove participant
      await participantService.removeParticipant(participant.id);

      // Update room participant count
      await participantService.updateRoomParticipantCount(roomId);

      // Leave socket room
      socket.leave(roomId);

      // Remove from memory room
      if (room) {
        room.participants.delete(participant.id);
      }

      // Notify other participants
      socket.to(roomId).emit('participant-left', {
        participantId: participant.id,
      });

      logger.info(`Participant ${participant.id} left room ${roomId}`);
    } catch (error) {
      logger.error('Error in leave-room handler:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) return;

      const { roomId } = participant;

      // Close all transports, producers, and consumers
      const room = roomService.getMemoryRoom(roomId);
      const memoryParticipant = room?.participants.get(participant.id);
      if (memoryParticipant) {
        // Close producers
        memoryParticipant.producers.forEach((producer) => {
          producer.close();
          socket.to(roomId).emit('producer-closed', {
            producerId: producer.id,
            participantId: participant.id,
          });
        });

        // Close consumers
        memoryParticipant.consumers.forEach((consumer) => {
          consumer.close();
        });

        // Close transports
        memoryParticipant.transports.forEach((transport) => {
          transport.close();
        });
      }

      // Remove participant
      await participantService.removeParticipant(participant.id);

      // Update room participant count
      await participantService.updateRoomParticipantCount(roomId);

      // Remove from memory room
      if (room) {
        room.participants.delete(participant.id);
      }

      // Notify other participants
      socket.to(roomId).emit('participant-left', {
        participantId: participant.id,
      });

      logger.info(`Participant ${participant.id} disconnected from room ${roomId}`);
    } catch (error) {
      logger.error('Error in disconnect handler:', error);
    }
  });
}
