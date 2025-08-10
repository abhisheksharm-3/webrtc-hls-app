/**
 * @file Manages the lifecycle of rooms, coordinating between the database and live media state.
 */
import prisma from '../config/database';
import { LiveRoom } from '../models/Room';
import { Room, RoomUpdateInput, Participant } from '@relay-app/shared'; // Correctly import Participant
import * as workerManager from '../mediasoup/worker';
import * as routerManager from '../mediasoup/router';
import { logger } from '../utils/logger';

const liveRooms = new Map<string, LiveRoom>();

// --- Public Functions ---

export function getLiveRoom(roomId: string): LiveRoom | undefined {
  return liveRooms.get(roomId);
}

/**
 * Returns a snapshot array of all currently active live rooms.
 */
export function getAllLiveRooms(): LiveRoom[] {
  return Array.from(liveRooms.values());
}

/**
 * ✅ CORRECTED: Retrieves a room's data from the database and combines it
 * with live participant data to match the shared 'Room' type.
 */
export async function getRoomFromDb(roomId: string): Promise<Room | null> {
  const dbRecord = await prisma.room.findUnique({ where: { id: roomId } });
  if (!dbRecord) {
    return null;
  }

  // Add the participants array to satisfy the 'Room' type.
  const liveRoom = getLiveRoom(roomId);
  const participants: Participant[] = liveRoom
    ? Array.from(liveRoom.participants.values()).map(p => p.toPlainObject())
    : [];

  return { 
    ...dbRecord, 
    hlsUrl: dbRecord.hlsUrl === null ? undefined : dbRecord.hlsUrl, 
    participants 
  };
}

export async function createRoom(id: string, name: string): Promise<LiveRoom | null> {
  try {
    await prisma.room.create({
      data: { id, name, isActive: true }
    });
    return activateLiveRoom(id);
  } catch (error) {
    logger.error(`Error creating new room with id ${id}:`, error);
    return null;
  }
}

export async function findOrCreateLiveRoom(roomId: string): Promise<LiveRoom | null> {
  const existingLiveRoom = getLiveRoom(roomId);
  if (existingLiveRoom) {
    return existingLiveRoom;
  }

  const roomRecord = await prisma.room.findUnique({ where: { id: roomId } });
  if (!roomRecord) {
    logger.warn(`Attempted to join a non-existent room: ${roomId}`);
    return null;
  }

  return activateLiveRoom(roomId);
}

/**
 * ✅ CORRECTED: Updates a room and ensures the returned object
 * includes the 'participants' array to match the 'Room' type.
 */
export async function updateRoom(
  roomId: string,
  data: RoomUpdateInput
): Promise<Room | null> {
  try {
    const updatedRoomRecord = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    const liveRoom = getLiveRoom(roomId);
    if (liveRoom) {
      if (data.hlsUrl !== undefined) {
        liveRoom.router.appData.hlsUrl = data.hlsUrl;
      }
      // Add the participants array to satisfy the 'Room' type.
      const participants: Participant[] = Array.from(liveRoom.participants.values()).map(p => p.toPlainObject());
      return { 
        ...updatedRoomRecord, 
        hlsUrl: updatedRoomRecord.hlsUrl === null ? undefined : updatedRoomRecord.hlsUrl, 
        participants 
      };
    }
    
    // If the room isn't live, return with an empty participants array.
    return { 
      ...updatedRoomRecord, 
      hlsUrl: updatedRoomRecord.hlsUrl === null ? undefined : updatedRoomRecord.hlsUrl, 
      participants: [] 
    };

  } catch (error) {
    logger.error(`Error updating room in DB | roomId: ${roomId}`, error);
    return null;
  }
}

export async function closeRoom(roomId: string): Promise<void> {
  const room = liveRooms.get(roomId);
  if (!room) return;

  logger.info(`Shutting down live room | roomId: ${roomId}`);
  routerManager.closeRouter(room.router.id);
  liveRooms.delete(roomId);
  
  await prisma.room.update({
    where: { id: roomId },
    data: { isActive: false },
  }).catch((err: Error) => logger.error(`Failed to mark room as inactive in DB | roomId: ${roomId}`, err));
}

/**
 * ✅ CORRECTED: Retrieves all rooms and enriches each one
 * with participant data to match the 'Room[]' type.
 */
export async function getAllRoomsFromDb(): Promise<Room[]> {
  const dbRecords = await prisma.room.findMany();
  
  const rooms: Room[] = dbRecords.map(dbRecord => {
    const liveRoom = getLiveRoom(dbRecord.id);
    const participants: Participant[] = liveRoom
      ? Array.from(liveRoom.participants.values()).map(p => p.toPlainObject())
      : [];
    return { 
      ...dbRecord, 
      hlsUrl: dbRecord.hlsUrl === null ? undefined : dbRecord.hlsUrl, 
      participants 
    };
  });

  return rooms;
}

// --- Helper Functions ---

async function activateLiveRoom(roomId: string): Promise<LiveRoom> {
  logger.info(`Activating room from DB | roomId: ${roomId}`);
  const worker = workerManager.getNextWorker();
  const router = await routerManager.createRouter(worker);
  const newLiveRoom = new LiveRoom(roomId, router);
  liveRooms.set(roomId, newLiveRoom);
  return newLiveRoom;
}