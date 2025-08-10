import { types as mediasoupTypes } from 'mediasoup';
import env from './environment';

export const mediasoupConfig = {
  /**
   * Worker settings
   */
  worker: {
    rtcMinPort: env.MEDIASOUP_MIN_PORT,
    rtcMaxPort: env.MEDIASOUP_MAX_PORT,
    logLevel: env.NODE_ENV === 'development' ? 'debug' : 'warn',
    logTags: [
      'info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp',
      'rtx', 'bwe', 'score',
    ],
  } as mediasoupTypes.WorkerSettings,

  /**
   * Router settings
   */
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: { 'x-google-start-bitrate': 1000 },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  } as mediasoupTypes.RouterOptions,

  /**
   * WebRtcTransport settings
   */
  webRtcTransport: {
    // ✅ THIS IS THE FINAL FIX
    // We force Mediasoup to only listen on the IPv4 loopback address.
    // This solves the "address type mis-match" issue in Firefox.
    // In a production environment, you would replace '127.0.0.1' with '0.0.0.0'
    // and set the `announcedIp`.
    listenIps: [{
      ip: '127.0.0.1',
      announcedIp: undefined, // Not needed for localhost
    }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000,
  } as mediasoupTypes.WebRtcTransportOptions,

  /**
   * PlainTransport settings for server-side processes like HLS recording.
   */
  plainTransport: {
    listenIp: { ip: '127.0.0.1' },
  } as mediasoupTypes.PlainTransportOptions,
};