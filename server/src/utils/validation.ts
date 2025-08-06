import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
});

export const joinRoomSchema = z.object({
  roomId: z.string().min(1).max(50), // Allow any string room ID, not just UUIDs
});

export const produceSchema = z.object({
  transportId: z.string(),
  kind: z.enum(['audio', 'video']),
  rtpParameters: z.any(),
});

export const consumeSchema = z.object({
  transportId: z.string(),
  producerId: z.string(),
  rtpCapabilities: z.any(),
});

export const transportSchema = z.object({
  direction: z.enum(['send', 'recv']),
});

export const connectTransportSchema = z.object({
  transportId: z.string(),
  dtlsParameters: z.any(),
});
