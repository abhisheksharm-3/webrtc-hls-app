/**
 * @file Registers all WebRTC signaling event handlers for a socket connection.
 */
import { Socket, Server } from 'socket.io';
import { types as mediasoupTypes } from 'mediasoup';
import { logger } from '../../utils/logger';
import { WebRtcTransportParams } from '@relay-app/shared';
import { connectTransport, createWebRtcTransport, getTransport } from '../../mediasoup/transport';
import { createProducer, getProducer } from '../../mediasoup/producer';
import { createConsumer, resumeConsumer } from '../../mediasoup/consumer';
import { getLiveParticipant } from '../../services/ParticipantService';
import { getLiveRoom, updateRoom } from '../../services/RoomService';
import { startRecording, stopRecording } from '../../services/HLSService';

export function registerWebRtcHandlers(io: Server, socket: Socket): void {

  /**
   * Creates a server-side WebRTC transport for either sending or receiving.
   */
  socket.on('create-transport', async (data: { direction: 'send' | 'recv' }, callback: (params: WebRtcTransportParams | { error: string }) => void) => {
    try {
      const participant = getLiveParticipant(socket.id);
      if (!participant || participant.isViewer) {
        throw new Error('Participant not found or is a viewer.');
      }
      const room = getLiveRoom(participant.roomId);
      if (!room) {
        throw new Error('Room not found.');
      }

      const transportParams = await createWebRtcTransport(room.router);
      const transport = getTransport(transportParams.id);
      if (transport) {
        // IMPORTANT: Tag the transport with its direction.
        // Ensure we create a new appData object to avoid reference sharing issues
        transport.appData = {
          ...transport.appData,
          direction: data.direction,
          participantId: participant.id
        };
        participant.addTransport(transport);
        logger.info(`✅ ${data.direction} transport created for participant ${participant.id} | transportId: ${transport.id}`);
      } else {
        logger.error(`❌ Failed to retrieve transport ${transportParams.id} after creation`);
        throw new Error('Transport creation failed - could not retrieve transport');
      }
      
      callback(transportParams);
    } catch (error) {
      logger.error(`Error in 'create-transport' for socket ${socket.id}:`, error);
      callback({ error: (error as Error).message });
    }
  });

  /**
   * Connects a client-side transport to its server-side counterpart.
   */
  socket.on('connect-transport', async (data: { transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters }, callback) => {
    try {
      // Add timeout for connection attempt
      const connectPromise = connectTransport(data.transportId, data.dtlsParameters);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transport connection timeout')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      logger.info(`✅ Transport connected successfully | transportId: ${data.transportId}`);
      callback({ connected: true });
    } catch (error) {
      logger.error(`Error in 'connect-transport' for socket ${socket.id}:`, error);
      callback({ error: (error as Error).message });
    }
  });

  /**
   * Creates a server-side producer after a client starts sending a media track.
   */
  socket.on('produce', async (data: { transportId: string, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters }, callback) => {
    try {
      const participant = getLiveParticipant(socket.id);
      if (!participant) throw new Error('Participant not found.');

      const transport = getTransport(data.transportId);
      if (!transport) throw new Error('Transport not found.');

      const producer = await createProducer(transport, data.kind, data.rtpParameters);
      // Attach routerId to producer's appData for stats/queries
      producer.appData = {
        ...producer.appData,
        routerId: (transport.appData as any).routerId,
        transport: transport,
      };
      participant.addProducer(producer);
      
      if (data.kind === 'video') participant.hasVideo = true;
      if (data.kind === 'audio') participant.hasAudio = true;

      callback({ id: producer.id });

      socket.to(participant.roomId).emit('new-producer', {
        producerId: producer.id,
        participantId: participant.id,
      });

      // Auto-start HLS when the host begins producing media
      const room = getLiveRoom(participant.roomId);
      if (room && participant.isHost) {
        // If HLS is not running and we have audio, start HLS (audio-only is acceptable)
        if (!room.hlsProcess && participant.hasAudio) {
          try {
            const { playlistUrl } = await startRecording(room);
            await updateRoom(room.id, { hlsUrl: playlistUrl });
            io.to(room.id).emit('hls-started', { roomId: room.id, playlistUrl });
            logger.info(`✅ Auto-started HLS for room ${room.id} with ${participant.hasVideo ? 'audio+video' : 'audio-only'}`);
          } catch (e) {
            logger.error(`Failed to auto-start HLS for room ${room.id}:`, e);
          }
        }
        // If HLS is running with audio-only and we just got video, restart HLS for better quality
        else if (room.hlsProcess && !room.hlsProcess.killed && data.kind === 'video' && participant.hasAudio) {
          try {
            logger.info(`🔄 Restarting HLS for room ${room.id} to include video track`);
            await stopRecording(room);
            const { playlistUrl } = await startRecording(room);
            await updateRoom(room.id, { hlsUrl: playlistUrl });
            io.to(room.id).emit('hls-restarted', { roomId: room.id, playlistUrl });
            logger.info(`✅ Restarted HLS for room ${room.id} with audio+video`);
          } catch (e) {
            logger.error(`Failed to restart HLS for room ${room.id}:`, e);
          }
        }
      }
      
      // Restart HLS when new participants join and start producing (if HLS is already running)
      const wasHlsRunning = room && room.hlsProcess && !room.hlsProcess.killed;
      if (wasHlsRunning && !participant.isHost) {
        // Only restart if this participant now has both audio and video (complete stream)
        // Also add a small delay to ensure both audio and video producers are created
        if (participant.hasAudio && participant.hasVideo) {
          // Use setTimeout to debounce multiple rapid producer creations
          setTimeout(async () => {
            try {
              // Double-check that HLS is still running and participant still has both tracks
              if (!room.hlsProcess || room.hlsProcess.killed || !participant.hasAudio || !participant.hasVideo) {
                logger.info(`🔄 Skipping HLS restart - conditions changed for ${participant.name}`);
                return;
              }
              
              logger.info(`🔄 Restarting HLS for room ${room.id} to include new participant: ${participant.name}`);
              logger.info(`🔄 Room ${room.id} currently has ${room.participants.size} participants`);
              
              // List all participants with their producer counts
              room.participants.forEach((p, id) => {
                const producerCount = (p as any).producers ? (p as any).producers.size : 0;
                logger.info(`🔄 Participant ${(p as any).name || id}: ${producerCount} producers, hasAudio: ${(p as any).hasAudio}, hasVideo: ${(p as any).hasVideo}`);
              });
              
              await stopRecording(room);
              const { playlistUrl } = await startRecording(room);
              await updateRoom(room.id, { hlsUrl: playlistUrl });
              io.to(room.id).emit('hls-restarted', { roomId: room.id, playlistUrl });
              logger.info(`✅ Restarted HLS for room ${room.id} with new participant: ${participant.name}`);
            } catch (e) {
              logger.error(`Failed to restart HLS for room ${room.id} with new participant:`, e);
            }
          }, 2000); // 2 second delay to ensure both audio and video are ready
        }
      }
    } catch (error) {
      logger.error(`Error in 'produce' for socket ${socket.id}:`, error);
      callback({ error: (error as Error).message });
    }
  });

  /**
   * Creates a server-side consumer to send a media track to a client.
   */
  /**
 * Creates a server-side consumer to send a media track to a client.
 */
socket.on('consume', async (data: { producerId: string, rtpCapabilities: mediasoupTypes.RtpCapabilities }, callback) => {
  try {
    const consumerParticipant = getLiveParticipant(socket.id);
    if (!consumerParticipant) throw new Error('Consuming participant not found.');

    // Viewers should not be consuming via WebRTC
    if (consumerParticipant.isViewer) {
      throw new Error('Viewers cannot consume WebRTC streams. Use HLS instead.');
    }

    const producer = getProducer(data.producerId);
    if (!producer) throw new Error('Producer to be consumed not found.');

    const transport = consumerParticipant.getRecvTransport();
    if (!transport) throw new Error('No receiving transport found for consumer.');

    // Check if transport is closed before consuming
    if (transport.closed) {
      logger.warn(`Transport ${transport.id} is closed, consumer may not work immediately`);
    }

    const consumer = await createConsumer(transport, producer, data.rtpCapabilities);
    consumerParticipant.addConsumer(consumer);
    
    // Set up consumer event handlers
    consumer.on('transportclose', () => {
      logger.info(`Consumer transport closed: ${consumer.id}`);
      consumerParticipant.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      logger.info(`Consumer producer closed: ${consumer.id}`);
      consumerParticipant.consumers.delete(consumer.id);
      socket.emit('producer-closed', { producerId: consumer.producerId });
    });

    // Return consumer parameters immediately - DON'T resume yet
    callback({
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });

    // Resume consumer after client has had time to set up
    // This gives the client transport time to connect if it hasn't already
    setTimeout(async () => {
      try {
        // Check if consumer and transport are still valid before resuming
        if (consumer.closed) {
          logger.warn(`Consumer ${consumer.id} was closed before resume attempt`);
          return;
        }
        
        if (transport.closed) {
          logger.warn(`Transport ${transport.id} was closed before consumer resume`);
          return;
        }

        await resumeConsumer(consumer.id);
        logger.info(`✅ Consumer resumed: ${consumer.id} for producer: ${data.producerId}`);
      } catch (error) {
        logger.error(`Failed to resume consumer ${consumer.id}:`, error);
        // Clean up consumer if resume fails
        try {
          consumerParticipant.consumers.delete(consumer.id);
          consumer.close();
        } catch (cleanupError) {
          logger.error(`Failed to cleanup consumer ${consumer.id}:`, cleanupError);
        }
      }
    }, 1000); // Increased wait time to 1 second for better transport stability

  } catch (error) {
    logger.error(`Error in 'consume' for socket ${socket.id}:`, error);
    callback({ error: (error as Error).message });
  }
});
}