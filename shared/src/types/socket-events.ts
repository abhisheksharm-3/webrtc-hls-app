import { RtpCapabilities, RtpParameters } from "mediasoup-client/lib/RtpParameters";
import { Participant } from "./room";
import { WebRtcTransportParams } from "./mediasoup";

// A generic type for the ack callback functions used in socket.emit
export type SocketAckCallback<T = {}> = (response: ({ error?: string } & T)) => void;

/**
 * Defines the events and their payloads that the server sends to the client.
 */
export interface ServerToClientEvents {
  "room-joined": (payload: {
    room: { participants: Participant[] };
    participantId: string;
    routerRtpCapabilities: RtpCapabilities;
    existingProducers: { producerId: string; participantId: string }[];
    isHlsEnabled: boolean;
    hlsUrl?: string;
  }) => void;
  "new-participant": (payload: { participant: Participant }) => void;
  "participant-left": (payload: { participantId: string }) => void;
  "new-producer": (payload: { producerId: string; participantId: string }) => void;
  "producer-closed": (payload: { producerId: string }) => void;
  "hls-started": (payload: { hlsUrl: string }) => void;
  "hls-stopped": () => void;
}

/**
 * Defines the events and their payloads that the client sends to the server.
 */
export interface ClientToServerEvents {
  "join-room": (
    payload: { roomId: string; name: string; role: string },
    callback: SocketAckCallback
  ) => void;
  "create-transport": (
    payload: { direction: "send" | "recv" },
    callback: SocketAckCallback<WebRtcTransportParams>
  ) => void;
  "connect-transport": (
    payload: { transportId: string; dtlsParameters: any },
    callback: SocketAckCallback
  ) => void;
  "produce": (
    payload: {
      transportId: string;
      kind: "video" | "audio";
      rtpParameters: RtpParameters;
    },
    callback: SocketAckCallback<{ id: string }>
  ) => void;
  "consume": (
    payload: {
      producerId: string;
      rtpCapabilities: RtpCapabilities;
    },
    callback: SocketAckCallback<{
      id: string;
      kind: "video" | "audio";
      rtpParameters: RtpParameters;
      producerId: string;
    }>
  ) => void;
  "start-hls": (payload: { roomId: string }) => void;
  "stop-hls": (payload: { roomId: string }) => void;
}