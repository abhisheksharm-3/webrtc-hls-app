/**
 * @file Registers all HLS-related event handlers for a given socket connection.
 */
import { Socket, Server } from 'socket.io';
import { logger } from '../../utils/logger';
import { getLiveParticipant } from '../../services/ParticipantService';
import { getLiveRoom, updateRoom } from '../../services/RoomService';
import { startRecording, stopRecording } from '../../services/HLSService';
// import { StartHlsPayload, HlsStartedPayload } from '@relay-app/shared';

export function registerHlsHandlers(io: Server, socket: Socket): void {
  /**
   * Handles the 'start-hls' event from a client.
   * This authorizes the host, finds all media producers in the room, and starts
   * the FFmpeg process to convert their streams into a single HLS broadcast.
   */
  socket.on('start-hls', async (data: { roomId: string } /* : StartHlsPayload */) => {
    try {
      const { roomId } = data;
      const participant = getLiveParticipant(socket.id);
      const room = getLiveRoom(roomId);

      // --- Authorization and Validation ---
      if (!participant || !participant.isHost) {
        return socket.emit('error', { message: 'Only the host can start the HLS stream.' });
      }
      if (!room) {
        return socket.emit('error', { message: `Room ${roomId} is not active.` });
      }
      // Check if the ffmpeg process is already running for this room
      if (room.hlsProcess) {
        return socket.emit('error', { message: 'HLS stream is already running for this room.' });
      }

      // --- Start the HLS Stream ---
      logger.info(`Host ${participant.id} is starting HLS for room ${roomId}`);
      
      // The HLS service does the heavy lifting: creates PlainTransports,
      // consumers for all producers, and spawns FFmpeg.
      const { playlistUrl } = await startRecording(room);
      
      // Update the database with the HLS playlist URL
      await updateRoom(roomId, { hlsUrl: playlistUrl });

      // Notify all clients in the room that the stream has started
      io.to(roomId).emit('hls-started', { 
        roomId, 
        playlistUrl
      } /* : HlsStartedPayload */);

      logger.info(`✅ HLS stream started for room ${roomId} at ${playlistUrl}`);

    } catch (error) {
      logger.error('Error starting HLS stream:', error);
      socket.emit('error', { message: 'Failed to start HLS stream.' });
    }
  });

  /**
   * Handles the 'stop-hls' event from the host to terminate the HLS broadcast.
   */
  socket.on('stop-hls', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const participant = getLiveParticipant(socket.id);
      const room = getLiveRoom(roomId);

      // --- Authorization and Validation ---
      if (!participant || !participant.isHost) {
        return socket.emit('error', { message: 'Only the host can stop the HLS stream.' });
      }
      if (!room) {
        return socket.emit('error', { message: `Room ${roomId} is not active.` });
      }
      
      logger.info(`Host ${participant.id} is stopping HLS for room ${roomId}`);
      await stopRecording(room);

      // Clear the HLS URL from the database
      await updateRoom(roomId, { hlsUrl: "" });

      // Notify all clients in the room
      io.to(roomId).emit('hls-stopped', { roomId });
      
      logger.info(`❌ HLS stream stopped for room ${roomId}`);

    } catch (error) {
      logger.error('Error stopping HLS stream:', error);
      socket.emit('error', { message: 'Failed to stop HLS stream.' });
    }
  });
}