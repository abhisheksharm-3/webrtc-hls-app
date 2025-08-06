import { types as mediasoupTypes } from 'mediasoup';
import { MediasoupRouter } from './router';
import { mediasoupConfig } from '../config/mediasoup';
import { logger } from '../utils/logger';

export class MediasoupTransport {
  private static instance: MediasoupTransport;
  private transports: Map<string, mediasoupTypes.Transport> = new Map();

  public static getInstance(): MediasoupTransport {
    if (!MediasoupTransport.instance) {
      MediasoupTransport.instance = new MediasoupTransport();
    }
    return MediasoupTransport.instance;
  }

  async createWebRtcTransport(
    roomId: string,
    direction: 'send' | 'recv'
  ): Promise<{
    transport: mediasoupTypes.WebRtcTransport;
    params: {
      id: string;
      iceParameters: mediasoupTypes.IceParameters;
      iceCandidates: mediasoupTypes.IceCandidate[];
      dtlsParameters: mediasoupTypes.DtlsParameters;
    };
  }> {
    try {
      const router = MediasoupRouter.getInstance().getRouter(roomId);
      if (!router) {
        throw new Error(`Router not found for room ${roomId}`);
      }

      const transport = await router.createWebRtcTransport({
        ...mediasoupConfig.webRtcTransport,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      // Add event listeners to the transport
      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'failed' || dtlsState === 'closed') {
          logger.warn(`Transport ${transport.id} DTLS state changed to: ${dtlsState}`);
        }
      });

      transport.on('icestatechange', (iceState) => {
        if (iceState === 'disconnected' || iceState === 'closed') {
          logger.warn(`Transport ${transport.id} ICE state changed to: ${iceState}`);
        }
      });

      transport.on('iceselectedtuplechange', (iceSelectedTuple) => {
        logger.info(`Transport ${transport.id} ICE selected tuple:`, iceSelectedTuple);
      });

      const transportId = transport.id;
      this.transports.set(transportId, transport);

      const params = {
        id: transportId,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };

      logger.info(`WebRTC transport created: ${transportId} (${direction}) for room ${roomId}`);

      return { transport, params };
    } catch (error) {
      logger.error(`Error creating WebRTC transport for room ${roomId}:`, error);
      throw error;
    }
  }

  async connectTransport(
    transportId: string,
    dtlsParameters: mediasoupTypes.DtlsParameters
  ): Promise<void> {
    try {
      const transport = this.transports.get(transportId);
      if (!transport) {
        throw new Error(`Transport not found: ${transportId}`);
      }

      await transport.connect({ dtlsParameters });
      logger.info(`Transport connected: ${transportId}`);
    } catch (error) {
      logger.error(`Error connecting transport ${transportId}:`, error);
      throw error;
    }
  }

  getTransport(transportId: string): mediasoupTypes.Transport | undefined {
    return this.transports.get(transportId);
  }

  async closeTransport(transportId: string): Promise<void> {
    const transport = this.transports.get(transportId);
    if (transport) {
      transport.close();
      this.transports.delete(transportId);
      logger.info(`Transport closed: ${transportId}`);
    }
  }

  async closeAllTransports(): Promise<void> {
    for (const [transportId, transport] of this.transports) {
      transport.close();
      logger.info(`Transport closed: ${transportId}`);
    }
    this.transports.clear();
  }

  getTransportStats(): any[] {
    return Array.from(this.transports.entries()).map(([transportId, transport]) => ({
      transportId,
      closed: transport.closed,
    }));
  }
}
