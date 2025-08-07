import { types as mediasoupTypes } from 'mediasoup';
/**
 * This file contains shared TypeScript types related to Mediasoup entities.
 * These types can be used by both the server and client applications.
 */

/**
 * Represents the parameters required by a client to establish a
 * WebRTC transport connection with the Mediasoup server.
 * This object is sent from the server to the client upon transport creation.
 */
export interface WebRtcTransportParams {
  id: string;
  iceParameters: mediasoupTypes.IceParameters;
  iceCandidates: mediasoupTypes.IceCandidate[];
  dtlsParameters: mediasoupTypes.DtlsParameters;
}
