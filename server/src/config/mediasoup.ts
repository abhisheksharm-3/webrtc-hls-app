import { types as mediasoupTypes } from 'mediasoup';
import env from './environment';

/**
 * A shared IP configuration for Mediasoup transports.
 * It uses the environment variables for the IP addresses that Mediasoup
 * listens on and announces to clients.
 */
const listenIpConfig: mediasoupTypes.TransportListenInfo = {
  protocol: 'udp',
  ip: env.MEDIASOUP_LISTEN_IP,
  announcedIp: env.MEDIASOUP_ANNOUNCED_IP,
};

/**
 * A central configuration object for all Mediasoup components.
 * This object is structured to be easily passed to the Mediasoup worker and router creation methods.
 */
export const mediasoupConfig = {
  /**
   * Worker settings configure the low-level Mediasoup process that handles media streams.
   * One worker is typically created per CPU core.
   */
  worker: {
    rtcMinPort: env.MEDIASOUP_MIN_PORT,
    rtcMaxPort: env.MEDIASOUP_MAX_PORT,
    // Use 'debug' for development to see detailed logs, and 'warn' for production.
    logLevel: env.NODE_ENV === 'development' ? 'debug' : 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
      'rtx', // Recommended for better stream recovery
      'bwe', // Recommended for bandwidth estimation
      'score', // Recommended for stream quality scoring
    ],
  } as mediasoupTypes.WorkerSettings,

  /**
   * Router settings define the capabilities of a virtual "media room".
   * It specifies which audio and video codecs are supported.
   */
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus', // Opus is the standard, high-quality audio codec for WebRTC.
        clockRate: 48000,
        channels: 2, // Stereo audio
      },
      {
        kind: 'video',
        mimeType: 'video/VP8', // VP8 is the mandatory baseline codec for WebRTC.
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      // H264 is a widely supported codec with good hardware acceleration on many devices.
      // The '42e01f' profile is a common and compatible choice.
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
   * WebRtcTransport settings configure the connection between a client (browser) and the server.
   * This is the standard transport for interactive WebRTC sessions.
   */
  webRtcTransport: {
    listenIps: [listenIpConfig],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true, // UDP is preferred for real-time media due to lower latency.
  } as mediasoupTypes.WebRtcTransportOptions,

  /**
   * PlainTransport settings are used for piping media to/from server-side processes.
   * This is essential for features like HLS recording, where media is sent from Mediasoup to FFmpeg.
   */
  plainTransport: {
    listenIp: listenIpConfig,
  } as mediasoupTypes.PlainTransportOptions,
};