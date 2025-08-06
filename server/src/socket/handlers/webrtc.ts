import { Socket, Server } from 'socket.io';
import { ParticipantService } from '../../services/ParticipantService';
import { RoomService } from '../../services/RoomService';
import { MediasoupTransport } from '../../mediasoup/transport';
import { MediasoupProducer } from '../../mediasoup/producer';
import { MediasoupConsumer } from '../../mediasoup/consumer';
import { logger } from '../../utils/logger';
import {
  transportSchema,
  connectTransportSchema,
  produceSchema,
  consumeSchema,
} from '../../utils/validation';

const participantService = ParticipantService.getInstance();
const roomService = RoomService.getInstance();
const mediasoupTransport = MediasoupTransport.getInstance();
const mediasoupProducer = MediasoupProducer.getInstance();
const mediasoupConsumer = MediasoupConsumer.getInstance();

export function webrtcHandler(socket: Socket, io: Server): void {
  socket.on('create-transport', async (data: { direction: 'send' | 'recv' }, callback) => {
    try {
      const validationResult = transportSchema.safeParse(data);
      if (!validationResult.success) {
        callback({
          error: 'Invalid transport direction'
        });
        return;
      }

      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) {
        callback({
          error: 'Participant not found'
        });
        return;
      }

      const { direction } = validationResult.data;
      const { roomId } = participant;

      const { transport, params } = await mediasoupTransport.createWebRtcTransport(
        roomId,
        direction
      );

      // Store transport in memory room
      const room = roomService.getMemoryRoom(roomId);
      const memoryParticipant = room?.participants.get(participant.id);
      if (memoryParticipant) {
        memoryParticipant.transports.set(params.id, transport);
      }

      callback(params);

      logger.info(`Transport created: ${params.id} (${direction}) for participant ${participant.id}`);
    } catch (error) {
      logger.error('Error creating transport:', error);
      callback({
        error: 'Failed to create transport'
      });
    }
  });

  socket.on('connect-transport', async (data: { transportId: string; dtlsParameters: any }, callback) => {
    try {
      const validationResult = connectTransportSchema.safeParse(data);
      if (!validationResult.success) {
        callback({
          error: 'Invalid transport connect data'
        });
        return;
      }

      const { transportId, dtlsParameters } = validationResult.data;

      logger.info(`Connecting transport: ${transportId}`);
      await mediasoupTransport.connectTransport(transportId, dtlsParameters);
      callback({});

      logger.info(`Transport connected: ${transportId}`);
    } catch (error) {
      logger.error('Error connecting transport:', error);
      callback({
        error: 'Failed to connect transport'
      });
    }
  });

  socket.on('produce', async (data: { transportId: string; kind: 'audio' | 'video'; rtpParameters: any }, callback) => {
    try {
      const validationResult = produceSchema.safeParse(data);
      if (!validationResult.success) {
        callback({
          error: 'Invalid produce data'
        });
        return;
      }

      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) {
        callback({
          error: 'Participant not found'
        });
        return;
      }

      const { transportId, kind, rtpParameters } = validationResult.data;
      const { roomId } = participant;

      logger.info(`Creating producer for ${kind} on transport ${transportId}`);
      const producer = await mediasoupProducer.createProducer(
        transportId,
        kind,
        rtpParameters
      );

      // Store producer in memory room
      const room = roomService.getMemoryRoom(roomId);
      const memoryParticipant = room?.participants.get(participant.id);
      if (memoryParticipant) {
        memoryParticipant.producers.set(producer.id, producer);
      }

      // Update participant media state
      await participantService.updateParticipant(participant.id, {
        hasVideo: kind === 'video' ? true : participant.hasVideo,
        hasAudio: kind === 'audio' ? true : participant.hasAudio,
        isStreaming: true,
      });

      callback({ id: producer.id });

      // Notify other participants about new producer
      socket.to(roomId).emit('new-producer', {
        producerId: producer.id,
        participantId: participant.id,
        kind,
      });

      logger.info(`Producer created: ${producer.id} (${kind}) for participant ${participant.id}`);
    } catch (error) {
      logger.error('Error creating producer:', error);
      callback({
        error: 'Failed to create producer'
      });
    }
  });

  socket.on('consume', async (data: { transportId: string; producerId: string; rtpCapabilities: any }, callback) => {
    try {
      const validationResult = consumeSchema.safeParse(data);
      if (!validationResult.success) {
        callback({
          error: 'Invalid consume data'
        });
        return;
      }

      const participant = await participantService.getParticipantBySocketId(socket.id);
      if (!participant) {
        callback({
          error: 'Participant not found'
        });
        return;
      }

      const { transportId, producerId, rtpCapabilities } = validationResult.data;

      const consumer = await mediasoupConsumer.createConsumer(
        transportId,
        producerId,
        rtpCapabilities
      );

      // Store consumer in memory room
      const room = roomService.getMemoryRoom(participant.roomId);
      const memoryParticipant = room?.participants.get(participant.id);
      if (memoryParticipant) {
        memoryParticipant.consumers.set(consumer.id, consumer);
      }

      callback({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      // Resume consumer automatically
      await mediasoupConsumer.resumeConsumer(consumer.id);

      logger.info(`Consumer created: ${consumer.id} for producer ${producerId}`);
    } catch (error) {
      logger.error('Error creating consumer:', error);
      callback({
        error: 'Failed to create consumer'
      });
    }
  });

  socket.on('pause-producer', async (data: { producerId: string }) => {
    try {
      const { producerId } = data;
      const participant = await participantService.getParticipantBySocketId(socket.id);
      
      await mediasoupProducer.pauseProducer(producerId);
      
      // Notify other participants about producer pause
      if (participant) {
        socket.to(participant.roomId).emit('producer-paused', {
          producerId,
          participantId: participant.id,
        });
      }
      
      logger.info(`Producer paused: ${producerId}`);
    } catch (error) {
      logger.error('Error pausing producer:', error);
    }
  });

  socket.on('resume-producer', async (data: { producerId: string }) => {
    try {
      const { producerId } = data;
      const participant = await participantService.getParticipantBySocketId(socket.id);
      
      await mediasoupProducer.resumeProducer(producerId);
      
      // Notify other participants about producer resume
      if (participant) {
        socket.to(participant.roomId).emit('producer-resumed', {
          producerId,
          participantId: participant.id,
        });
      }
      
      logger.info(`Producer resumed: ${producerId}`);
    } catch (error) {
      logger.error('Error resuming producer:', error);
    }
  });

  socket.on('close-producer', async (data: { producerId: string }) => {
    try {
      const { producerId } = data;
      const participant = await participantService.getParticipantBySocketId(socket.id);
      
      await mediasoupProducer.closeProducer(producerId);
      
      if (participant) {
        socket.to(participant.roomId).emit('producer-closed', {
          producerId,
          participantId: participant.id,
        });
      }

      logger.info(`Producer closed: ${producerId}`);
    } catch (error) {
      logger.error('Error closing producer:', error);
    }
  });

  socket.on('pause-consumer', async (data: { consumerId: string }) => {
    try {
      const { consumerId } = data;
      await mediasoupConsumer.pauseConsumer(consumerId);
      logger.info(`Consumer paused: ${consumerId}`);
    } catch (error) {
      logger.error('Error pausing consumer:', error);
    }
  });

  socket.on('resume-consumer', async (data: { consumerId: string }) => {
    try {
      const { consumerId } = data;
      await mediasoupConsumer.resumeConsumer(consumerId);
      logger.info(`Consumer resumed: ${consumerId}`);
    } catch (error) {
      logger.error('Error resuming consumer:', error);
    }
  });
}
