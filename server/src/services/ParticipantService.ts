/**
 * @file Manages the lifecycle of participants.
 */
import prisma from '../config/database';
import { LiveRoom } from '../models/Room';
import { LiveParticipant } from '../models/Participant';
import { logger } from '../utils/logger';
import { getAllLiveRooms, getLiveRoom } from './RoomService';

const liveParticipants = new Map<string, LiveParticipant>();

export function getLiveParticipant(socketId: string): LiveParticipant | undefined {
  return liveParticipants.get(socketId);
}

/**
 * Checks if a user with a given role is allowed to join a room.
 * @param room The LiveRoom instance.
 * @param role The desired role ('host', 'guest', 'viewer').
 * @returns An error message string if not allowed, otherwise null.
 */
export function canJoinRoom(room: LiveRoom, role: 'host' | 'guest' | 'viewer'): string | null {
    if (role === 'viewer') {
        return null; // Viewers can always join.
    }

    const participants = Array.from(room.participants.values());
    
    if (role === 'host') {
        const hasHost = participants.some(p => p.isHost);
        if (hasHost) {
            return 'This room already has a host.';
        }
    }

    if (role === 'guest') {
        // Count only host and guests, not viewers.
        const streamerCount = participants.filter(p => !p.isViewer).length;
        if (streamerCount >= 2) {
            return 'Room is full for streamers (host + 1 guest). You can join as a viewer.';
        }
    }

    return null; // Allowed to join.
}

export async function addParticipantToRoom(
  room: LiveRoom,
  socketId: string,
  name: string,
  isHost: boolean,
  isViewer: boolean
): Promise<LiveParticipant> {
  const dbRecord = await prisma.participant.create({
    data: { name, socketId, isHost, isViewer, roomId: room.id },
  });

  const liveParticipant = new LiveParticipant(dbRecord.id, socketId, room.id, name, isHost, isViewer);

  room.addParticipant(liveParticipant);
  liveParticipants.set(socketId, liveParticipant);

  logger.info(`Participant joined | name: ${name}, id: ${dbRecord.id}, room: ${room.id}`);
  return liveParticipant;
}

export async function removeParticipant(socketId: string): Promise<void> {
  const participant = liveParticipants.get(socketId);
  if (!participant) return;

  // 1. Instantly find the room using the stored roomId. No searching!
  const room = getLiveRoom(participant.roomId);

  // 2. Close Mediasoup resources.
  participant.close();
  
  // 3. Remove from the live room's state.
  room?.removeParticipant(socketId);
  
  // 4. Remove from this service's global map.
  liveParticipants.delete(socketId);
  
  // 5. Delete from the database.
  await prisma.participant.delete({ where: { id: participant.id } }).catch((err: Error) => {
    logger.error(`Failed to delete participant from DB | id: ${participant.id}`, err);
  });

  logger.info(`Participant left | name: ${participant.name}, id: ${participant.id}`);
}