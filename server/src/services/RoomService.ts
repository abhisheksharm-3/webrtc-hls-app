/**
 * @file Manages the lifecycle of rooms, coordinating between the database and live media state.
 */
import prisma from '../config/database';
import { LiveRoom } from '../models/Room';
import { Room as PlainRoom, Room, RoomUpdateInput } from '@relay-app/shared';
import * as workerManager from '../mediasoup/worker';
import * as routerManager from '../mediasoup/router';
import { logger } from '../utils/logger';

const liveRooms = new Map<string, LiveRoom>();

export function getLiveRoom(roomId: string): LiveRoom | undefined {
  return liveRooms.get(roomId);
}

export function getAllLiveRooms(): LiveRoom[] {
  return Array.from(liveRooms.values());
}

/**
 * Retrieves a room's data directly from the database.
 * @param roomId - The ID of the room to find.
 * @returns The database room object, or null if not found.
 */
export async function getRoomFromDb(roomId: string): Promise<Room | null> {
  return prisma.room.findUnique({ where: { id: roomId } });
}

export async function createRoom(name: string): Promise<PlainRoom> {
  const roomRecord = await prisma.room.create({ data: { name, isActive: true } });
  const worker = workerManager.getNextWorker();
  const router = await routerManager.createRouter(worker);
  const liveRoom = new LiveRoom(roomRecord.id, router);
  liveRooms.set(roomRecord.id, liveRoom);
  logger.info(`🚀 Room is now live | roomId: ${roomRecord.id}`);
  return liveRoom.toPlainObject(roomRecord);
}

export async function findOrCreateLiveRoom(roomId: string): Promise<LiveRoom | null> {
  const existingLiveRoom = getLiveRoom(roomId);
  if (existingLiveRoom) {
    return existingLiveRoom;
  }

  let roomRecord = await getRoomFromDb(roomId);
  if (!roomRecord) {
    // If the room doesn't exist in DB, create it on-the-fly to support direct URL joins
    try {
      roomRecord = await prisma.room.create({ data: { id: roomId, name: roomId, isActive: true } });
      logger.info(`Created room record for direct join | roomId: ${roomId}`);
    } catch (error) {
      logger.warn(`Attempted to join non-existent room and failed to create | roomId: ${roomId}`);
      return null;
    }
  }

  logger.info(`Activating room from DB | roomId: ${roomId}`);
  const worker = workerManager.getNextWorker();
  const router = await routerManager.createRouter(worker);
  const newLiveRoom = new LiveRoom(roomRecord.id, router);
  liveRooms.set(roomRecord.id, newLiveRoom);
  return newLiveRoom;
}

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
    if (liveRoom && data.hlsUrl !== undefined) {
      liveRoom.router.appData.hlsUrl = data.hlsUrl;
    }
    logger.info(`Room updated in DB | roomId: ${roomId}`);
    return updatedRoomRecord;
  } catch (error) {
    logger.error(`Error updating room in DB | roomId: ${roomId}`, error);
    return null;
  }
}

/**
 * Closes a live room, shuts down its Mediasoup router, and updates its DB status.
 * @param roomId The ID of the room to close.
 */
export async function closeRoom(roomId: string): Promise<void> {
    const room = liveRooms.get(roomId);
    if (!room) return;

    logger.info(`Shutting down live room | roomId: ${roomId}`);
    
    // This closes the router and all associated producers, consumers, etc.
    routerManager.closeRouter(room.router.id);
    
    // Remove from the active list.
    liveRooms.delete(roomId);
    
    // Mark as inactive in the database.
    await prisma.room.update({
        where: { id: roomId },
        data: { isActive: false },
    }).catch((err: Error) => logger.error(`Failed to mark room as inactive in DB | roomId: ${roomId}`, err));
}

/**
 * Retrieves all rooms from the database.
 * @returns An array of all room objects.
 */
export async function getAllRoomsFromDb(): Promise<Room[]> {
  return prisma.room.findMany();
}