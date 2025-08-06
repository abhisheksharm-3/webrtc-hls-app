import prisma from '../config/database';
import { logger } from '../utils/logger';
import { generateId } from '../utils/helpers';
import type { Room, CreateRoomRequest } from '../models/Room';

export class RoomService {
  private static instance: RoomService;
  private rooms: Map<string, Room> = new Map();

  public static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  async createRoom(data: CreateRoomRequest): Promise<Room> {
    try {
      const roomData = await prisma.room.create({
        data: {
          name: data.name,
          isActive: true,
          participantCount: 0,
        },
      });

      const room: Room = {
        id: roomData.id,
        name: roomData.name,
        isActive: roomData.isActive,
        participantCount: roomData.participantCount,
        createdAt: roomData.createdAt,
        updatedAt: roomData.updatedAt,
        participants: new Map(),
        producers: new Map(),
      };

      this.rooms.set(room.id, room);
      logger.info(`Room created: ${room.id}`);
      
      return room;
    } catch (error) {
      logger.error('Error creating room:', error);
      throw new Error('Failed to create room');
    }
  }

  async createRoomWithId(roomId: string, data: CreateRoomRequest): Promise<Room> {
    try {
      const roomData = await prisma.room.create({
        data: {
          id: roomId,
          name: data.name,
          isActive: true,
          participantCount: 0,
        },
      });

      const room: Room = {
        id: roomData.id,
        name: roomData.name,
        isActive: roomData.isActive,
        participantCount: roomData.participantCount,
        createdAt: roomData.createdAt,
        updatedAt: roomData.updatedAt,
        participants: new Map(),
        producers: new Map(),
      };

      this.rooms.set(room.id, room);
      logger.info(`Room created with custom ID: ${room.id}`);
      
      return room;
    } catch (error) {
      logger.error('Error creating room with custom ID:', error);
      throw new Error('Failed to create room');
    }
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      let room = this.rooms.get(roomId);
      
      if (!room) {
        const roomData = await prisma.room.findUnique({
          where: { id: roomId },
        });

        if (roomData) {
          room = {
            id: roomData.id,
            name: roomData.name,
            isActive: roomData.isActive,
            participantCount: roomData.participantCount,
            hlsUrl: roomData.hlsUrl || undefined,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            participants: new Map(),
            producers: new Map(),
          };
          this.rooms.set(room.id, room);
        }
      }

      return room || null;
    } catch (error) {
      logger.error('Error getting room:', error);
      return null;
    }
  }

  async getAllRooms(): Promise<Room[]> {
    try {
      const roomsData = await prisma.room.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return roomsData.map(roomData => ({
        id: roomData.id,
        name: roomData.name,
        isActive: roomData.isActive,
        participantCount: roomData.participantCount,
        hlsUrl: roomData.hlsUrl || undefined,
        createdAt: roomData.createdAt,
        updatedAt: roomData.updatedAt,
        participants: this.rooms.get(roomData.id)?.participants || new Map(),
        producers: this.rooms.get(roomData.id)?.producers || new Map(),
      }));
    } catch (error) {
      logger.error('Error getting rooms:', error);
      return [];
    }
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | null> {
    try {
      const roomData = await prisma.room.update({
        where: { id: roomId },
        data: {
          name: updates.name,
          isActive: updates.isActive,
          participantCount: updates.participantCount,
          hlsUrl: updates.hlsUrl,
        },
      });

      const room = this.rooms.get(roomId);
      if (room) {
        Object.assign(room, {
          name: roomData.name,
          isActive: roomData.isActive,
          participantCount: roomData.participantCount,
          hlsUrl: roomData.hlsUrl || undefined,
          updatedAt: roomData.updatedAt,
        });
      }

      return room || null;
    } catch (error) {
      logger.error('Error updating room:', error);
      return null;
    }
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      await prisma.room.delete({
        where: { id: roomId },
      });

      this.rooms.delete(roomId);
      logger.info(`Room deleted: ${roomId}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting room:', error);
      return false;
    }
  }

  getMemoryRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  setMemoryRoom(room: Room): void {
    this.rooms.set(room.id, room);
  }

  getAllMemoryRooms(): Map<string, Room> {
    return this.rooms;
  }
}
