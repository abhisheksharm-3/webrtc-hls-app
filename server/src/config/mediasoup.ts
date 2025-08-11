import { types as mediasoupTypes } from 'mediasoup';
import env from './environment';

// Destructure environment variables for cleaner usage within the config object.
const {
  NODE_ENV,
  MEDIASOUP_MIN_PORT,
  MEDIASOUP_MAX_PORT,
  MEDIASOUP_LISTEN_IP,
  MEDIASOUP_ANNOUNCED_IP,
  MEDIASOUP_FORCE_TCP,
} = env;

export const mediasoupConfig = {
  /**
   * Worker settings. Mediasoup workers are single-threaded processes that handle
   * a subset of routers. Scaling a Mediasoup application typically involves
   * running one worker per available CPU core.
   * @see https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerSettings
   */
  worker: {
    rtcMinPort: MEDIASOUP_MIN_PORT,
    rtcMaxPort: MEDIASOUP_MAX_PORT,
    logLevel: NODE_ENV === 'development' ? 'debug' : 'warn',
    logTags: [
      'info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp',
      'rtx', 'bwe', 'score', 'simulcast', 'svc',
    ],
    // appData can be used to store custom data for this worker.
    appData: { workerId: 'main-worker' },
  } as mediasoupTypes.WorkerSettings,

  /**
   * Router settings. A router is responsible for routing media streams
   * between transports within that router.
   * @see https://mediasoup.org/documentation/v3/mediasoup/api/#RouterOptions
   */
  router: {
    // Media codecs supported by the router. Clients must also support these.
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus', // Opus is the standard for WebRTC audio.
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8', // Good balance of quality and resilience.
        clockRate: 90000,
        parameters: { 'x-google-start-bitrate': 1000 },
      },
      {
        kind: 'video',
        mimeType: 'video/h264', // Offers better hardware acceleration on many devices.
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f', // Constrained Baseline Profile level 3.1
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ],
    // appData can be used to store custom data for this router.
    appData: { info: 'main-application-router' },
  } as mediasoupTypes.RouterOptions,

  /**
   * WebRtcTransport settings. This transport is used for communication
   * between the server and a client's browser.
   * @see https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
   */
  webRtcTransport: {
    listenIps: [{
      ip: MEDIASOUP_LISTEN_IP,
      // `announcedIp` is the public IP address of the server that clients will connect to.
      // This is crucial for environments behind NAT (like Docker or cloud servers).
      // In development, it can often be omitted.
      announcedIp: NODE_ENV === 'production' ? MEDIASOUP_ANNOUNCED_IP : undefined,
    }],
    // Prefer UDP for lower latency, but allow TCP as a fallback.
    // Forcing TCP can help with very restrictive firewalls but increases latency.
    enableUdp: !MEDIASOUP_FORCE_TCP,
    enableTcp: true,
    preferUdp: !MEDIASOUP_FORCE_TCP,
    // A sensible starting bitrate for new connections.
    initialAvailableOutgoingBitrate: 1_000_000, // 1 Mbps
    // appData can be used to associate this transport with a specific user or session.
    appData: { transportType: 'webrtc-client' },
  } as mediasoupTypes.WebRtcTransportOptions,

  /**
   * PlainTransport settings. Used for server-side media transport,
   * for example, to stream media to a recording or HLS process (like FFmpeg).
   * @see https://mediasoup.org/documentation/v3/mediasoup/api/#PlainTransportOptions
   */
  plainTransport: {
    listenIp: { ip: MEDIASOUP_LISTEN_IP },
    // Enable RTCP for quality monitoring.
    enableRtcp: true,
    // appData can be used to identify the purpose of this transport.
    appData: { transportType: 'server-side-hls' },
  } as mediasoupTypes.PlainTransportOptions,
};
