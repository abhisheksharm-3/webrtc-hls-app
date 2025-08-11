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
      const ack = (response: { error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response as AckResponse<Parameters<ClientToServerEvents[E]>[1]>);
        }
      };
      
      // Fix: Use spread operator to match the exact function signature
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
    
    // ✅ FIX: `params` is now correctly typed as WebRtcTransportParams
    const params = await emitWithAck("create-transport", { direction });
    
    const transport = direction === "send"
      ? device.createSendTransport({ ...params, iceServers })
      : device.createRecvTransport({ ...params, iceServers });

    transport.on("connect", async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback, errback) => {
      try {
        await emitWithAck("connect-transport", { transportId: transport.id, dtlsParameters });
        callback();
      } catch (err) { errback(err as Error); }
    });

    if (direction === "send") {
      transport.on("produce", async (producerParams, callback, errback) => {
        try {
          // ✅ FIX: The response is now correctly typed as { id: string }
          const { id } = await emitWithAck("produce", {
            transportId: transport.id,
            kind: producerParams.kind,
            rtpParameters: producerParams.rtpParameters,
          });
          callback({ id });
        } catch (err) { errback(err as Error); }
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
    
    // ✅ FIX: `data` is now correctly typed
    const data = await emitWithAck("consume", { producerId, rtpCapabilities });
    
    return recvTransport.consume({ ...data, appData: { participantId } });
  };

  const close = () => {
    sendTransport?.close();
    recvTransport?.close();
  };

  return { loadDevice, createTransport, produce, consume, close };
}

export type MediasoupManager = ReturnType<typeof createMediasoupManager>;