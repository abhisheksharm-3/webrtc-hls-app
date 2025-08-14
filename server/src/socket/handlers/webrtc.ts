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
import { startRecording } from '../../services/HLSService';

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
      await connectTransport(data.transportId, data.dtlsParameters);
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

      // Auto-start HLS when the host begins producing both audio and video
      const room = getLiveRoom(participant.roomId);
      if (room && participant.isHost && participant.hasAudio && participant.hasVideo && !room.hlsProcess) {
        try {
          const { playlistUrl } = await startRecording(room);
          await updateRoom(room.id, { hlsUrl: playlistUrl });
          io.to(room.id).emit('hls-started', { roomId: room.id, playlistUrl });
          logger.info(`✅ Auto-started HLS for room ${room.id}`);
        } catch (e) {
          logger.error(`Failed to auto-start HLS for room ${room.id}:`, e);
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
        await resumeConsumer(consumer.id);
        logger.info(`✅ Consumer resumed: ${consumer.id} for producer: ${data.producerId}`);
      } catch (error) {
        logger.error(`Failed to resume consumer ${consumer.id}:`, error);
      }
    }, 500); // Wait 500ms for client to be ready

  } catch (error) {
    logger.error(`Error in 'consume' for socket ${socket.id}:`, error);
    callback({ error: (error as Error).message });
  }
});
}