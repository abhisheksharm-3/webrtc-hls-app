import prisma from '../config/database';
import { logger } from '../utils/logger';
import type { Participant, ParticipantUpdate } from '../models/Participant';

export class ParticipantService {
  private static instance: ParticipantService;

  public static getInstance(): ParticipantService {
    if (!ParticipantService.instance) {
      ParticipantService.instance = new ParticipantService();
    }
    return ParticipantService.instance;
  }

  async createParticipant(data: {
    roomId: string;
    socketId: string;
    isHost?: boolean;
    isViewer?: boolean;
  }): Promise<Participant> {
    try {
      const participantData = await prisma.participant.create({
        data: {
          roomId: data.roomId,
          socketId: data.socketId,
          isHost: data.isHost || false,
          isStreaming: false,
          hasVideo: false,
          hasAudio: false,
        },
      });

      const participant: Participant = {
        id: participantData.id,
        roomId: participantData.roomId,
        socketId: participantData.socketId,
        isHost: participantData.isHost,
        isViewer: data.isViewer || false,
        isStreaming: participantData.isStreaming,
        hasVideo: participantData.hasVideo,
        hasAudio: participantData.hasAudio,
        joinedAt: participantData.joinedAt,
      };

      logger.info(`Participant created: ${participant.id} in room ${participant.roomId} as ${participant.isHost ? 'host' : participant.isViewer ? 'viewer' : 'guest'}`);
      return participant;
    } catch (error) {
      logger.error('Error creating participant:', error);
      throw new Error('Failed to create participant');
    }
  }

  async getParticipantById(participantId: string): Promise<Participant | null> {
    try {
      const participantData = await prisma.participant.findUnique({
        where: { id: participantId },
      });

      if (!participantData) return null;

      return {
        id: participantData.id,
        roomId: participantData.roomId,
        socketId: participantData.socketId,
        isHost: participantData.isHost,
        isViewer: false, // Default for existing participants
        isStreaming: participantData.isStreaming,
        hasVideo: participantData.hasVideo,
        hasAudio: participantData.hasAudio,
        joinedAt: participantData.joinedAt,
      };
    } catch (error) {
      logger.error('Error getting participant:', error);
      return null;
    }
  }

  async getParticipantBySocketId(socketId: string): Promise<Participant | null> {
    try {
      const participantData = await prisma.participant.findUnique({
        where: { socketId },
      });

      if (!participantData) return null;

      return {
        id: participantData.id,
        roomId: participantData.roomId,
        socketId: participantData.socketId,
        isHost: participantData.isHost,
        isViewer: false, // Default for existing participants
        isStreaming: participantData.isStreaming,
        hasVideo: participantData.hasVideo,
        hasAudio: participantData.hasAudio,
        joinedAt: participantData.joinedAt,
      };
    } catch (error) {
      logger.error('Error getting participant by socket ID:', error);
      return null;
    }
  }

  async getParticipantsByRoomId(roomId: string): Promise<Participant[]> {
    try {
      const participantsData = await prisma.participant.findMany({
        where: { roomId },
        orderBy: { joinedAt: 'asc' },
      });

      return participantsData.map(participantData => ({
        id: participantData.id,
        roomId: participantData.roomId,
        socketId: participantData.socketId,
        isHost: participantData.isHost,
        isViewer: false, // Default for existing participants
        isStreaming: participantData.isStreaming,
        hasVideo: participantData.hasVideo,
        hasAudio: participantData.hasAudio,
        joinedAt: participantData.joinedAt,
      }));
    } catch (error) {
      logger.error('Error getting participants by room ID:', error);
      return [];
    }
  }

  async updateParticipant(
    participantId: string,
    updates: ParticipantUpdate
  ): Promise<Participant | null> {
    try {
      const participantData = await prisma.participant.update({
        where: { id: participantId },
        data: updates,
      });

      return {
        id: participantData.id,
        roomId: participantData.roomId,
        socketId: participantData.socketId,
        isHost: participantData.isHost,
        isViewer: false, // Default for existing participants
        isStreaming: participantData.isStreaming,
        hasVideo: participantData.hasVideo,
        hasAudio: participantData.hasAudio,
        joinedAt: participantData.joinedAt,
      };
    } catch (error) {
      logger.error('Error updating participant:', error);
      return null;
    }
  }

  async removeParticipant(participantId: string): Promise<boolean> {
    try {
      await prisma.participant.delete({
        where: { id: participantId },
      });

      logger.info(`Participant removed: ${participantId}`);
      return true;
    } catch (error) {
      logger.error('Error removing participant:', error);
      return false;
    }
  }

  async removeParticipantBySocketId(socketId: string): Promise<boolean> {
    try {
      await prisma.participant.delete({
        where: { socketId },
      });

      logger.info(`Participant removed by socket ID: ${socketId}`);
      return true;
    } catch (error) {
      logger.error('Error removing participant by socket ID:', error);
      return false;
    }
  }

  async updateRoomParticipantCount(roomId: string): Promise<void> {
    try {
      const count = await prisma.participant.count({
        where: { roomId },
      });

      await prisma.room.update({
        where: { id: roomId },
        data: { participantCount: count },
      });
    } catch (error) {
      logger.error('Error updating room participant count:', error);
    }
  }
}
