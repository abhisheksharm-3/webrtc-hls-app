/**
 * @file Registers event handlers for view-only participants (HLS viewers).
 */
import { Socket, Server } from 'socket.io';
import { logger } from '../../utils/logger';
import { getLiveRoom, getRoomFromDb } from '../../services/RoomService';
import { addParticipantToRoom } from '../../services/ParticipantService';
// import { JoinAsViewerPayload } from '@relay-app/shared';

/**
 * Registers all viewer-related handlers for a new socket connection.
 * @param io The Socket.IO server instance.
 * @param socket The newly connected socket.
 */
export function registerViewerHandlers(io: Server, socket: Socket): void {

  /**
   * Handles a user's request to join a room as a view-only participant.
   * A viewer can only join a room that is already active.
   */
  socket.on('join-as-viewer', async (payload: { roomId: string, name: string } /* : JoinAsViewerPayload */) => {
    try {
      const { roomId, name } = payload;

      // 1. A viewer can only join a room that is currently "live".
      const room = getLiveRoom(roomId);
      if (!room) {
        return socket.emit('error', { message: 'Stream not found or is not active.' });
      }
      
      // 2. Add the viewer to the room as a participant with isViewer=true.
      // Our services will handle creating the DB record and the in-memory object.
      const participant = await addParticipantToRoom(
        room,
        socket.id,
        name,
        false, // isHost
        true   // isViewer
      );

      // 3. Join the main socket room to receive broadcasts (e.g., 'hls-stopped').
      socket.join(roomId);

      // 4. Send the standard 'room-joined' event back to the viewer.
      // The client will see isViewer=true and know to show the HLS player.
      const dbRoomData = await getRoomFromDb(roomId);
      if (!dbRoomData) {
        return socket.emit('error', { message: 'Room data could not be loaded from database.' });
      }
      socket.emit('room-joined', {
        room: room.toPlainObject(dbRoomData),
        participantId: participant.id,
        isViewer: true,
      });

      // 5. Notify everyone else that a viewer has joined.
      socket.to(roomId).emit('new-participant', { participant: participant.toPlainObject() });

      logger.info(`Viewer joined | name: ${name}, socket: ${socket.id}, room: ${roomId}`);

    } catch (error) {
      logger.error(`Error in 'join-as-viewer' handler for socket ${socket.id}:`, error);
      socket.emit('error', { message: 'An internal error occurred while joining as a viewer.' });
    }
  });
}