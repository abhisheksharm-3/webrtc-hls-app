import { types as mediasoupTypes } from 'mediasoup';
import { mediasoupConfig } from '../config/mediasoup';
import { logger } from '../utils/logger';
import { WebRtcTransportParams } from '@relay-app/shared';

/**
 * A Map to store all active Mediasoup Transport instances, with the transport's ID as the key.
 * This state is private to the module.
 */
const transports = new Map<string, mediasoupTypes.Transport>();

/**
 * Creates a new WebRTC transport on a given router for a client.
 *
 * @param router - The Mediasoup router instance that will host the new transport.
 * @returns A promise that resolves with the parameters needed by the client to connect.
 * @throws Will throw an error if the router fails to create the transport.
 */
export async function createWebRtcTransport(
  router: mediasoupTypes.Router
): Promise<WebRtcTransportParams> {
  try {
    const transport = await router.createWebRtcTransport(mediasoupConfig.webRtcTransport);
    transports.set(transport.id, transport);
    
    // Associate the router with this transport for later canConsume checks.
    transport.appData.router = router;
    transport.appData.routerId = router.id;
    // Helpful for correlating producers later
    transport.appData.transportId = transport.id;

    // When the transport is closed for any reason, remove it from our map.
    transport.on('@close', () => {
      transports.delete(transport.id);
      logger.info(`Transport closed, removed from state | transportId: ${transport.id}`);
    });

    // (Optional) You can listen for connection state changes for debugging.
    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        logger.warn(`Transport DTLS state changed to: ${dtlsState} | transportId: ${transport.id}`);
      } else {
        logger.info(`Transport DTLS state changed to: ${dtlsState} | transportId: ${transport.id}`);
      }
    });

    // Add ICE state change monitoring
    transport.on('icestatechange', (iceState) => {
      logger.info(`Transport ICE state changed to: ${iceState} | transportId: ${transport.id}`);
      if (iceState === 'closed') {
        logger.warn(`Transport ICE connection issue: ${iceState} | transportId: ${transport.id}`);
      }
    });

    // Add general transport state monitoring
    transport.observer.on('close', () => {
      logger.info(`Transport observer: transport closed | transportId: ${transport.id}`);
    });

    transport.observer.on('newproducer', (producer) => {
      logger.info(`Transport observer: new producer created | transportId: ${transport.id}, producerId: ${producer.id}`);
    });

    transport.observer.on('newconsumer', (consumer) => {
      logger.info(`Transport observer: new consumer created | transportId: ${transport.id}, consumerId: ${consumer.id}`);
    });

    logger.info(`✅ WebRTC transport created | transportId: ${transport.id}`);

    // Return only the parameters the client needs to establish the connection.
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  } catch (error) {
    logger.error(`Error creating WebRTC transport | routerId: ${router.id}`, error);
    throw error;
  }
}

/**
 * Connects a client-side transport to its server-side counterpart using the client's DTLS parameters.
 * This completes the secure connection handshake.
 *
 * @param transportId - The ID of the transport to connect.
 * @param dtlsParameters - The DTLS parameters provided by the client's transport.
 * @throws Will throw an error if the transport is not found or fails to connect.
 */
export async function connectTransport(
  transportId: string,
  dtlsParameters: mediasoupTypes.DtlsParameters
): Promise<void> {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found for connection | transportId: ${transportId}`);
  }

  try {
    await transport.connect({ dtlsParameters });
    logger.info(`🤝 Transport connected | transportId: ${transportId}`);
  } catch (error) {
    logger.error(`Error connecting transport | transportId: ${transportId}`, error);
    throw error;
  }
}

/**
 * Retrieves a transport instance by its ID.
 *
 * @param transportId - The ID of the transport to retrieve.
 * @returns The transport instance, or undefined if not found.
 */
export function getTransport(transportId: string): mediasoupTypes.Transport | undefined {
  return transports.get(transportId);
}