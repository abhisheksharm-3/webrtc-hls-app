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
        transport.appData.direction = data.direction;
        participant.addTransport(transport);
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
  socket.on('consume', async (data: { producerId: string, rtpCapabilities: mediasoupTypes.RtpCapabilities }, callback) => {
    try {
        const consumerParticipant = getLiveParticipant(socket.id);
        if (!consumerParticipant) throw new Error('Consuming participant not found.');

        const producer = getProducer(data.producerId);
        if (!producer) throw new Error('Producer to be consumed not found.');

        const transport = consumerParticipant.getRecvTransport();
        if (!transport) throw new Error('No receiving transport found for consumer.');

        const consumer = await createConsumer(transport, producer, data.rtpCapabilities);
        consumerParticipant.addConsumer(consumer);
        
        await resumeConsumer(consumer.id);

        callback({
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
        });
    } catch (error) {
        logger.error(`Error in 'consume' for socket ${socket.id}:`, error);
        callback({ error: (error as Error).message });
    }
  });
}