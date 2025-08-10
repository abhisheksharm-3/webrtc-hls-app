import { z } from 'zod';

export const CreateRoomSchema = z.object({
  id: z.string().min(6),
  name: z.string().min(1).max(50),
});

export const JoinRoomSchema = z.object({
  roomId: z.string().min(6),
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
