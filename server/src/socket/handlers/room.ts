/**
 * @file Registers all room-related event handlers for a socket connection.
 * This includes joining, leaving, and managing basic participant states.
 */
import { Socket, Server } from 'socket.io';
import { logger } from '../../utils/logger';
import { closeRoom, findOrCreateLiveRoom, getLiveRoom, getRoomFromDb } from '../../services/RoomService';
import { addParticipantToRoom, canJoinRoom, getLiveParticipant, removeParticipant } from '../../services/ParticipantService';
// Assuming validation schemas and shared types are available
// import { joinRoomSchema, JoinRoomPayload } from '@relay-app/shared';

/**
 * Registers all room-related handlers for a new socket connection.
 * @param io The Socket.IO server instance.
 * @param socket The newly connected socket.
 */
export function registerRoomHandlers(io: Server, socket: Socket): void {

  /**
   * Handles a user's request to join a room.
   * This is the main entry point for a user into a session.
   */
  socket.on('join-room', async (payload: { roomId: string, name: string, role: 'host' | 'guest' | 'viewer' }) => {
    try {
      // const { roomId, name, role } = joinRoomSchema.parse(payload);
      const { roomId, name, role } = payload; // Assuming validation for now

      // 1. Find or create the live room instance.
      const room = await findOrCreateLiveRoom(roomId);
      if (!room) {
        return socket.emit('error', { message: 'Room could not be found or created.' });
      }

      // 2. Authorize the join request.
      const authError = canJoinRoom(room, role);
      if (authError) {
        return socket.emit('error', { message: authError });
      }

      // 3. Add the participant to the room.
      const isHost = role === 'host' || room.participants.size === 0;
      const isViewer = role === 'viewer';
      const participant = await addParticipantToRoom(room, socket.id, name, isHost, isViewer);

      // 4. Join the socket to the room's broadcast channel.
      socket.join(roomId);

      // 5. Send confirmation and initial state to the joining user.
      const dbRoomData = await getRoomFromDb(roomId);
      if (!dbRoomData) {
        return socket.emit('error', { message: 'Room data could not be loaded from database.' });
      }
      // Collect existing producers so a late joiner can immediately consume
      const existingProducerEvents: { producerId: string, participantId: string }[] = [];
      room.participants.forEach((p) => {
        p.getProducerIds?.().forEach((producerId) => {
          existingProducerEvents.push({ producerId, participantId: p.id });
        });
      });

      socket.emit('room-joined', {
        room: room.toPlainObject(dbRoomData),
        participantId: participant.id,
        routerRtpCapabilities: isViewer ? null : room.router.rtpCapabilities,
        existingProducers: existingProducerEvents,
      });

      // 6. Notify everyone else in the room about the new participant.
      socket.to(roomId).emit('new-participant', { participant: participant.toPlainObject() });

      logger.info(`Participant joined | name: ${name}, socket: ${socket.id}, room: ${roomId}, role: ${role}`);

    } catch (error) {
      logger.error(`Error in 'join-room' handler for socket ${socket.id}:`, error);
      socket.emit('error', { message: 'An internal error occurred while joining the room.' });
    }
  });

  /**
   * Handles a user explicitly leaving a room.
   */
  socket.on('leave-room', () => {
    // The disconnect handler will take care of all cleanup.
    socket.disconnect();
  });

  /**
   * Handles the socket 'disconnect' event, which is the single source of truth for cleanup.
   * This is called automatically when a user closes their browser or loses connection.
   */
  socket.on('disconnect', async () => {
    try {
      const participant = getLiveParticipant(socket.id);
      if (!participant) return; // User was not in a room

      logger.info(`Participant disconnecting | name: ${participant.name}, socket: ${socket.id}`);
      
      // The service handles all cleanup: closing transports, removing from DB, etc.
      await removeParticipant(socket.id);

      // Notify the remaining participants that this user has left.
      io.to(participant.roomId).emit('participant-left', { participantId: participant.id });

      // If the room is now empty, we can close the live room to conserve resources.
      const room = getLiveRoom(participant.roomId);
      if (room && room.participants.size === 0) {
        logger.info(`Room is now empty, closing live room | roomId: ${participant.roomId}`);
        closeRoom(participant.roomId);
      }
    } catch (error) {
      logger.error(`Error in 'disconnect' handler for socket ${socket.id}:`, error);
    }
  });
}