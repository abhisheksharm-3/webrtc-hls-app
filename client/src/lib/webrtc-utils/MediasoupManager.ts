import { ClientToServerEvents, ServerToClientEvents } from "@relay-app/shared";
import { Device } from "mediasoup-client";
import type { Consumer, Producer, Transport, RtpCapabilities, DtlsParameters } from "mediasoup-client/types";
import { Socket } from "socket.io-client";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * A helper type to infer the successful response type from a SocketAckCallback.
 * For a callback like `(response: { error?: string, id: string }) => void`, it extracts `{ id: string }`.
 */
type AckResponse<T> = T extends (res: infer R) => void ? Omit<R, 'error'> : never;

/**
 * A factory function that creates a functional Mediasoup manager.
 * It uses a closure to hold state, avoiding the need for a class.
 */
export function createMediasoupManager(socket: TypedSocket, iceServers: RTCIceServer[]) {
  let device: Device | null = null;
  let sendTransport: Transport | null = null;
  let recvTransport: Transport | null = null;

  /**
   * A promisified, type-safe wrapper for socket.emit that correctly infers the response type.
   */
  const emitWithAck = <E extends keyof ClientToServerEvents>(
    event: E,
    payload: Parameters<ClientToServerEvents[E]>[0]
  ): Promise<AckResponse<Parameters<ClientToServerEvents[E]>[1]>> => {
    return new Promise((resolve, reject) => {
      const ack = (response: { error?: string | Error }) => {
        if (response.error) {
          reject(response.error instanceof Error ? response.error : new Error(String(response.error)));
        } else {
          resolve(response as AckResponse<Parameters<ClientToServerEvents[E]>[1]>);
        }
      };
      
      // Use spread operator to match the exact function signature
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket.emit as any)(event, payload, ack);
    });
  };

  const loadDevice = async (routerRtpCapabilities: RtpCapabilities) => {
    try {
      device = new Device();
      await device.load({ routerRtpCapabilities });
    } catch (error) {
      console.error("Failed to load device:", error);
      if ((error as Error).name === "UnsupportedError") alert("Browser not supported for WebRTC.");
    }
  };

  const createTransport = async (direction: "send" | "recv"): Promise<Transport> => {
    if (!device) throw new Error("Device not loaded, cannot create transport.");
    
    const params = await emitWithAck("create-transport", { direction });
    
    const transport = direction === "send"
      ? device.createSendTransport({ ...params, iceServers })
      : device.createRecvTransport({ ...params, iceServers });

    // Listener for the initial connection setup
    transport.on("connect", async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback, errback) => {
      try {
        console.log(`🤝 [TRANSPORT] Event 'connect' for ${direction} transport`);
        await emitWithAck("connect-transport", { transportId: transport.id, dtlsParameters });
        callback();
      } catch (err) { 
        console.error(`❌ [TRANSPORT] Error in 'connect' event for ${direction} transport:`, err);
        errback(err as Error); 
      }
    });

    // ✨ KEY ADDITION: Listener for the ongoing connection state
    transport.on("connectionstatechange", (state: RTCPeerConnectionState) => {
        console.log(`🚦 [TRANSPORT] Connection state for ${direction} transport changed to: ${state.toUpperCase()}`);
        if (state === 'failed') {
          console.error(`❌ [TRANSPORT] ${direction} transport connection failed! This is likely a network or server configuration issue.`);
          // Optionally, you could close the transport here or attempt a restart.
          // transport.close(); 
        } else if (state === 'disconnected') {
          console.warn(`⚠️ [TRANSPORT] ${direction} transport disconnected, may recover automatically`);
        } else if (state === 'connected') {
          console.log(`✅ [TRANSPORT] ${direction} transport successfully connected`);
        }
    });

    // Add ICE gathering state monitoring
    transport.on("icegatheringstatechange", (state: RTCIceGatheringState) => {
        console.log(`🧊 [ICE] ICE gathering state for ${direction} transport changed to: ${state.toUpperCase()}`);
        if (state === 'complete') {
          console.log(`✅ [ICE] ${direction} transport ICE gathering completed`);
        }
    });

    if (direction === "send") {
      transport.on("produce", async (producerParams, callback, errback) => {
        try {
          const { id } = await emitWithAck("produce", {
            transportId: transport.id,
            kind: producerParams.kind,
            rtpParameters: producerParams.rtpParameters,
          });
          callback({ id });
        } catch (err) { 
          console.error(`❌ [TRANSPORT] Error in 'produce' event:`, err);
          errback(err as Error); 
        }
      });
      sendTransport = transport;
    } else {
      recvTransport = transport;
    }
    return transport;
  };

  const produce = async (track: MediaStreamTrack): Promise<Producer> => {
    if (!sendTransport) throw new Error("Send transport is not created.");
    return sendTransport.produce({ track });
  };

  const consume = async (producerId: string, participantId: string): Promise<Consumer> => {
    if (!recvTransport || !device) throw new Error("Receive transport or device not available.");
    const { rtpCapabilities } = device;
    
    const data = await emitWithAck("consume", { producerId, rtpCapabilities });
    
    const consumer = await recvTransport.consume({ 
      ...data, 
      appData: { participantId } 
    });

    console.log(`✅ Consumer created: ${consumer.id} for producer: ${producerId} (initially paused)`);
    
    return consumer;
  };

  const close = () => {
    sendTransport?.close();
    recvTransport?.close();
  };

  // Removed connectRecvTransport as it's not needed with the new robust listeners
  return { loadDevice, createTransport, produce, consume, close };
}

export type MediasoupManager = ReturnType<typeof createMediasoupManager>;
