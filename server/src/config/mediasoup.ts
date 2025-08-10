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
    listenIps: [{
      ip: env.MEDIASOUP_LISTEN_IP,
      announcedIp: env.NODE_ENV === 'production' ? env.MEDIASOUP_ANNOUNCED_IP : undefined,
    }],
    enableUdp: env.MEDIASOUP_FORCE_TCP ? false : true,
    enableTcp: true,
    preferUdp: env.MEDIASOUP_FORCE_TCP ? false : true,
    initialAvailableOutgoingBitrate: 1_000_000,
  } as mediasoupTypes.WebRtcTransportOptions,

  /**
   * PlainTransport settings for server-side processes like HLS recording.
   */
  plainTransport: {
    listenIp: { ip: env.MEDIASOUP_LISTEN_IP },
  } as mediasoupTypes.PlainTransportOptions,
};