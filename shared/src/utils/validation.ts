import { z } from 'zod';

export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(50),
});

export const JoinRoomSchema = z.object({
  roomId: z.string().uuid(),
});

export const ProduceSchema = z.object({
  transportId: z.string(),
  kind: z.enum(['audio', 'video']),
  rtpParameters: z.any(),
});

export const ConsumeSchema = z.object({
  transportId: z.string(),
  producerId: z.string(),
  rtpCapabilities: z.any(),
});

export const TransportSchema = z.object({
  direction: z.enum(['send', 'recv']),
});
