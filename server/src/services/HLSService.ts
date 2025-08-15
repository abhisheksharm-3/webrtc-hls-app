/**
 * @file Manages the FFmpeg process for converting Mediasoup streams to HLS.
 * This refactored version uses best practices for process management, port allocation,
 * and error handling to ensure production readiness.
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import portfinder from "portfinder";
import { types as mediasoupTypes } from "mediasoup";
import { LiveRoom } from "../models/Room";
import { logger } from "../utils/logger";
import env from "../config/environment";

// --- Configuration and Constants ---

const FFMPEG_PATH = env.FFMPEG_PATH || "ffmpeg";
const HLS_STORAGE_PATH = env.HLS_STORAGE_PATH;

// --- Interfaces and Types ---

/**
 * @interface HlsPorts
 * @description Defines the set of dynamically allocated UDP ports for RTP and RTCP.
 */
interface HlsPorts {
  videoRtpPort: number;
  videoRtcpPort: number;
  audioRtpPort: number;
  audioRtcpPort: number;
}

/**
 * @interface StreamPorts
 * @description Defines ports for individual streams to support multiple participants.
 */
interface StreamPorts {
  rtpPort: number;
  rtcpPort: number;
  kind: 'video' | 'audio';
  streamIndex: number;
}

/**
 * @interface HlsData
 * @description Represents the Mediasoup and filesystem resources associated with an HLS stream.
 */
interface HlsData {
  transports: mediasoupTypes.PlainTransport[];
  consumers: mediasoupTypes.Consumer[];
  sdpPath: string;
}

/**
 * @interface TransportConsumerPair
 * @description A helper type to associate a Mediasoup consumer with its transport.
 */
interface TransportConsumerPair {
  transport: mediasoupTypes.PlainTransport;
  consumer: mediasoupTypes.Consumer;
}

// --- Public API ---

/**
 * Starts the HLS recording process for a given room.
 * This involves selecting producers, creating Mediasoup resources, generating an SDP file,
 * and spawning an FFmpeg process to create the HLS stream.
 * @param {LiveRoom} room - The room instance to record.
 * @returns {Promise<{ playlistUrl: string }>} A promise that resolves with the relative URL to the HLS playlist.
 * @throws Will throw an error if setup fails at any stage.
 */
export async function startRecording(
  room: LiveRoom,
): Promise<{ playlistUrl: string }> {
  if (room.hlsProcess && !room.hlsProcess.killed) {
    throw new Error(`HLS recording is already in progress for room ${room.id}`);
  }

  logger.info(`[HLS] Starting HLS recording for room ${room.id}...`);

  try {
    // 1. Ensure HLS output directory exists and is writable
    const absoluteHlsPath = await ensureHlsDirectory();
    const hlsOutputDir = path.join(absoluteHlsPath, room.id);
    await fs.promises.mkdir(hlsOutputDir, { recursive: true });

    // 2. Select all available audio and video producers for multi-stream support
    const { videoProducers, audioProducers } = selectProducers(room);
    
    // Check if we have at least one producer (audio-only streams are acceptable)
    if (videoProducers.length === 0 && audioProducers.length === 0) {
      throw new Error(`No active producers found in room ${room.id}. Cannot start HLS stream.`);
    }
    
    // Combine all producers for consumer creation
    const availableProducers = [...videoProducers, ...audioProducers];
    
    if (availableProducers.length === 0) {
      throw new Error(`No valid producers available for HLS in room ${room.id}`);
    }
    
    logger.info(`🎬 [HLS] Starting HLS with ${availableProducers.length} producer(s): ${availableProducers.map(p => `${p.kind}(${p.id.substring(0,8)})`).join(', ')}`);
    logger.info(`🎬 [HLS] Room ${room.id} has ${room.participants.size} participants with producers`);

    // 3. Find available network ports for each stream
    const streamPorts = await findAvailablePortsForStreams(availableProducers);
    logger.info(`[HLS] Found available ports for room ${room.id}:`, streamPorts.map(p => `${p.kind}${p.streamIndex}:${p.rtpPort}/${p.rtcpPort}`).join(', '));

    // 4. Create individual Mediasoup transports and consumers for each stream
    const { transports, consumers, pairs } =
      await createMultiStreamTransportsAndConsumers(
        room.router,
        availableProducers,
        streamPorts,
      );
    logger.info(`[HLS] Created ${transports.length} transports and ${consumers.length} consumers for ${availableProducers.length} streams.`);

    // 5. Generate and write the multi-stream SDP file for FFmpeg
    const sdpPath = path.join(hlsOutputDir, "stream.sdp");
    const sdpString = generateMultiStreamSdp(pairs, streamPorts);
    await fs.promises.writeFile(sdpPath, sdpString);
    logger.info(`[HLS] Generated multi-stream SDP file at ${sdpPath}`);

    // 6. Resume consumers to start data flow
    await Promise.all(consumers.map((c) => c.resume()));
    logger.info("[HLS] Resumed all consumers.");

    // 7. Spawn the FFmpeg process with stream counts for dynamic mixing
    const streamCounts = {
      video: videoProducers.length,
      audio: audioProducers.length
    };
    logger.info(`🎬 [HLS] Stream counts for FFmpeg: video=${streamCounts.video}, audio=${streamCounts.audio}`);
    const ffmpegProcess = runFfmpeg(sdpPath, hlsOutputDir, room.id, streamCounts);
    room.hlsProcess = ffmpegProcess;
    logger.info(`[HLS] Spawned FFmpeg process with PID ${ffmpegProcess.pid} for room ${room.id}.`);

    // 8. Store resource references for cleanup
    room.appData.hls = { transports, consumers, sdpPath };

    const playlistUrl = `/hls/${room.id}/playlist.m3u8`;
    return { playlistUrl };
  } catch (error) {
    // FIX: Safely handle 'unknown' error type
    logger.error(`[HLS] Failed to start HLS recording for room ${room.id}:`, error);
    // Clean up any resources that might have been created before the error
    await stopRecording(room).catch((cleanupError) =>
      logger.error(`[HLS] Critical: Failed to cleanup resources after a startup error:`, cleanupError),
    );
    throw error;
  }
}

/**
 * Stops the HLS recording for a given room.
 * This function gracefully terminates the FFmpeg process and waits for it to exit
 * before cleaning up all associated Mediasoup resources and filesystem artifacts.
 * This prevents race conditions where a new stream is started before the old one's
 * network ports have been released.
 * @param {LiveRoom} room - The room instance to stop recording for.
 * @returns {Promise<void>} A promise that resolves when cleanup is fully complete.
 */
export function stopRecording(room: LiveRoom): Promise<void> {
  // Return a promise that resolves only when all cleanup is done.
  return new Promise((resolve) => {
    logger.info(`[HLS] Stopping HLS recording for room ${room.id}...`);
    const hlsData = room.appData.hls as HlsData | undefined;
    const hlsProcess = room.hlsProcess;
    
    // Clear the process reference immediately to allow new recordings
    room.hlsProcess = undefined;

    /**
     * A self-contained cleanup function to close resources and delete files.
     * This avoids code duplication.
     */
    const cleanupResources = async () => {
      // 1. Clean up Mediasoup resources (consumers and transports)
      if (hlsData) {
        logger.info("[HLS] Closing Mediasoup consumers and transports...");
        for (const resource of [...hlsData.consumers, ...hlsData.transports]) {
          try {
            if (!resource.closed) resource.close();
          } catch (e) {
            logger.warn(`[HLS] Failed to close resource ${resource.id}. It may have already been closed.`);
          }
        }

        // 2. Delete the SDP file
        try {
          await fs.promises.unlink(hlsData.sdpPath);
        } catch (e) {
          // Ignore "file not found" errors, as it might have already been deleted.
          if (e && typeof e === 'object' && 'code' in e && e.code !== 'ENOENT') {
            logger.warn(`[HLS] Failed to delete SDP file at ${hlsData.sdpPath}.`);
          }
        }
        room.appData.hls = undefined;
      }

      // 3. (Optional) Clean up the HLS output directory
      const hlsOutputDir = path.join(path.resolve(process.cwd(), HLS_STORAGE_PATH), room.id);
      try {
        logger.info(`[HLS] Deleting HLS output directory: ${hlsOutputDir}`);
        await fs.promises.rm(hlsOutputDir, { recursive: true, force: true });
      } catch (err) {
        logger.warn(`[HLS] Failed to delete HLS output directory: ${err instanceof Error ? err.message : String(err)}`);
      }

      logger.info(`[HLS] Successfully stopped recording for room ${room.id}.`);
      resolve(); // All done, resolve the main promise.
    };

    // --- Main Logic ---

    // If a process exists and hasn't been killed yet...
    if (hlsProcess && !hlsProcess.killed) {
      // Set a listener to perform cleanup *after* the process confirms it has closed.
      hlsProcess.on('close', () => {
        logger.info(`[HLS] FFmpeg process ${hlsProcess.pid} has exited.`);
        cleanupResources();
      });

      // Now, send the signal to terminate the process.
      logger.info(`[HLS] Sending SIGTERM to FFmpeg process ${hlsProcess.pid}.`);
      hlsProcess.kill('SIGTERM');

    } else {
      // If there's no process to kill, just run the cleanup logic immediately.
      cleanupResources();
    }
  });
}


// --- Private Helper Functions ---

/**
 * Ensures the main HLS storage directory exists and is writable.
 * @private
 * @returns {Promise<string>} The absolute path to the HLS storage directory.
 */
async function ensureHlsDirectory(): Promise<string> {
  try {
    const absoluteHlsPath = path.resolve(process.cwd(), HLS_STORAGE_PATH);
    await fs.promises.mkdir(absoluteHlsPath, { recursive: true });

    // Verify write permissions by creating and deleting a temporary file.
    const testFile = path.join(absoluteHlsPath, ".writable");
    await fs.promises.writeFile(testFile, "test");
    await fs.promises.unlink(testFile);

    return absoluteHlsPath;
  } catch (error) {
    // FIX: Safely handle 'unknown' error type
    const message = error instanceof Error ? error.message : String(error);
    logger.error("HLS storage directory setup failed. Check path and permissions.", error);
    throw new Error(`HLS directory setup failed: ${message}`);
  }
}

/**
 * Selects all active video and audio producers from the room for multi-stream HLS.
 * This enables mixing multiple participant streams into a single HLS output.
 * @private
 * @param {LiveRoom} room - The room to select producers from.
 * @returns {{ videoProducers: mediasoupTypes.Producer[]; audioProducers: mediasoupTypes.Producer[] }} All available producers.
 */
function selectProducers(room: LiveRoom): {
  videoProducers: mediasoupTypes.Producer[];
  audioProducers: mediasoupTypes.Producer[];
} {
  const allProducers = Array.from(room.participants.values()).flatMap((p) =>
    Array.from((p as any)["producers"].values() as mediasoupTypes.Producer[]),
  ).filter((p) => !p.closed && !p.paused);

  const videoProducers = allProducers.filter((p) => p.kind === "video");
  const audioProducers = allProducers.filter((p) => p.kind === "audio");

  logger.info(`🎬 [HLS] Available producers: ${allProducers.map(p => `${p.kind}(${p.id.substring(0,8)})`).join(', ')}`);
  logger.info(`🎬 [HLS] Selected producers: Video=[${videoProducers.map(p => p.id.substring(0,8)).join(', ')}], Audio=[${audioProducers.map(p => p.id.substring(0,8)).join(', ')}]`);

  // Log missing producer types for debugging
  const missingTypes = [];
  if (videoProducers.length === 0) missingTypes.push('video');
  if (audioProducers.length === 0) missingTypes.push('audio');
  
  if (missingTypes.length > 0) {
    logger.warn(`🎬 [HLS] Missing producer types: ${missingTypes.join(', ')}. Available: ${allProducers.map(p => p.kind).join(', ')}`);
  }

  return { videoProducers, audioProducers };
}

/**
 * Finds available UDP ports for RTP and RTCP for multiple streams.
 * @private
 * @param {mediasoupTypes.Producer[]} producers - All producers that need ports
 * @returns {Promise<StreamPorts[]>} A promise resolving to an array of port configurations for each stream.
 */
async function findAvailablePortsForStreams(producers: mediasoupTypes.Producer[]): Promise<StreamPorts[]> {
  // Use a high port range to avoid conflicts with common services.
  portfinder.setBasePort(40000);

  const findPort = () => portfinder.getPortPromise();

  // Each producer needs 2 ports (RTP + RTCP)
  const portCount = producers.length * 2;
  const ports = await Promise.all(Array(portCount).fill(null).map(() => findPort()));

  const streamPorts: StreamPorts[] = [];
  let videoIndex = 0;
  let audioIndex = 0;

  for (let i = 0; i < producers.length; i++) {
    const producer = producers[i];
    const rtpPort = ports[i * 2];
    const rtcpPort = ports[i * 2 + 1];
    
    streamPorts.push({
      rtpPort,
      rtcpPort,
      kind: producer.kind as 'video' | 'audio',
      streamIndex: producer.kind === 'video' ? videoIndex++ : audioIndex++
    });
  }

  return streamPorts;
}

/**
 * Legacy function for backward compatibility - now delegates to new multi-stream function
 * @deprecated Use findAvailablePortsForStreams instead
 */
async function findAvailablePorts(streamCount: number = 1): Promise<HlsPorts> {
  // Use a high port range to avoid conflicts with common services.
  portfinder.setBasePort(40000);

  const findPort = () => portfinder.getPortPromise();

  // Find ports for multiple streams: each stream needs 2 ports (RTP + RTCP) for video and audio
  const portCount = Math.max(4, streamCount * 4); // At least 4 ports, more if needed
  const ports = await Promise.all(Array(portCount).fill(null).map(() => findPort()));

  return {
    videoRtpPort: ports[0],
    videoRtcpPort: ports[1],
    audioRtpPort: ports[2],
    audioRtcpPort: ports[3],
  };
}

/**
 * Creates individual Mediasoup PlainTransports and Consumers for each stream.
 * This enables proper multi-stream support with separate ports for each participant.
 * @private
 */
async function createMultiStreamTransportsAndConsumers(
  router: mediasoupTypes.Router,
  producers: mediasoupTypes.Producer[],
  streamPorts: StreamPorts[],
): Promise<{
  transports: mediasoupTypes.PlainTransport[];
  consumers: mediasoupTypes.Consumer[];
  pairs: TransportConsumerPair[];
}> {
  const transportOptions = {
    listenIp: { ip: "127.0.0.1", announcedIp: undefined },
    rtcpMux: false,
    comedia: false,
  };

  const transports: mediasoupTypes.PlainTransport[] = [];
  const consumers: mediasoupTypes.Consumer[] = [];
  const pairs: TransportConsumerPair[] = [];

  // Create a separate transport for each producer/stream
  for (let i = 0; i < producers.length; i++) {
    const producer = producers[i];
    const portConfig = streamPorts[i];
    
    logger.info(`🎬 [Transport] Creating transport for ${producer.kind} stream ${portConfig.streamIndex} on ports ${portConfig.rtpPort}/${portConfig.rtcpPort}`);
    
    // Create individual transport for this stream
    const transport = await router.createPlainTransport(transportOptions);
    await transport.connect({ 
      ip: "127.0.0.1", 
      port: portConfig.rtpPort, 
      rtcpPort: portConfig.rtcpPort 
    });
    
    // Create consumer for this producer on its dedicated transport
    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities: router.rtpCapabilities,
      paused: true, // Start paused, will be resumed after FFmpeg starts
    });
    
    transports.push(transport);
    consumers.push(consumer);
    pairs.push({ transport, consumer });
    
    logger.info(`✅ [Transport] Created transport and consumer for ${producer.kind} stream ${portConfig.streamIndex}`);
  }

  return { transports, consumers, pairs };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createMultiStreamTransportsAndConsumers instead
 */
async function createRtpTransportsAndConsumers(
  router: mediasoupTypes.Router,
  producers: mediasoupTypes.Producer[],
  ports: HlsPorts,
): Promise<{
  transports: mediasoupTypes.PlainTransport[];
  consumers: mediasoupTypes.Consumer[];
  pairs: TransportConsumerPair[];
}> {
  const transportOptions = {
    listenIp: { ip: "127.0.0.1", announcedIp: undefined },
    rtcpMux: false,
    comedia: false,
  };

  const [videoTransport, audioTransport] = await Promise.all([
    router.createPlainTransport(transportOptions),
    router.createPlainTransport(transportOptions),
  ]);

  await Promise.all([
    videoTransport.connect({ ip: "127.0.0.1", port: ports.videoRtpPort, rtcpPort: ports.videoRtcpPort }),
    audioTransport.connect({ ip: "127.0.0.1", port: ports.audioRtpPort, rtcpPort: ports.audioRtcpPort }),
  ]);

  const consumers: mediasoupTypes.Consumer[] = [];
  const pairs: TransportConsumerPair[] = [];

  for (const producer of producers) {
    const transport = producer.kind === "video" ? videoTransport : audioTransport;
    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities: router.rtpCapabilities,
      paused: true, // Start paused, will be resumed after FFmpeg starts
    });
    consumers.push(consumer);
    pairs.push({ transport, consumer });
  }

  return { transports: [videoTransport, audioTransport], consumers, pairs };
}

/**
 * Generates an SDP (Session Description Protocol) string for multiple streams.
 * This creates separate media sections for each stream with unique ports.
 * @private
 * @param {TransportConsumerPair[]} pairs - The transport-consumer pairs.
 * @param {StreamPorts[]} streamPorts - The allocated ports for each stream.
 * @returns {string} The generated SDP content.
 */
function generateMultiStreamSdp(pairs: TransportConsumerPair[], streamPorts: StreamPorts[]): string {
  const sdpParts = [
    "v=0",
    "o=- 0 0 IN IP4 127.0.0.1",
    "s=Mediasoup-HLS-MultiStream",
    "c=IN IP4 127.0.0.1",
    "t=0 0",
  ];

  // Generate a media section for each stream
  for (let i = 0; i < pairs.length; i++) {
    const { consumer } = pairs[i];
    const portConfig = streamPorts[i];
    const { rtpParameters, kind } = consumer;
    const codec = rtpParameters.codecs[0];

    logger.info(`🎬 [SDP] Generating ${kind} track ${portConfig.streamIndex}: codec=${codec.mimeType}, payloadType=${codec.payloadType}, ports=${portConfig.rtpPort}/${portConfig.rtcpPort}`);

    sdpParts.push(
      `m=${kind} ${portConfig.rtpPort} RTP/AVP ${codec.payloadType}`,
      `a=rtcp:${portConfig.rtcpPort}`,
      `a=sendrecv`,
      `a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}${codec.channels ? `/${codec.channels}` : ""}`,
    );
    
    // Add codec-specific format parameters
    if (codec.parameters && Object.keys(codec.parameters).length > 0) {
      for (const [key, value] of Object.entries(codec.parameters)) {
        sdpParts.push(`a=fmtp:${codec.payloadType} ${key}=${value}`);
      }
    } else if (kind === 'video' && codec.mimeType.toLowerCase().includes('vp8')) {
      // Add default VP8 parameters if none are provided
      logger.warn(`🎬 [SDP] No codec parameters for VP8, adding default max-fr and max-fs`);
      sdpParts.push(`a=fmtp:${codec.payloadType} max-fr=30;max-fs=3600`);
    }
  }
  
  const sdpContent = sdpParts.join("\r\n") + "\r\n";
  logger.info(`🎬 [SDP] Generated multi-stream SDP content:\n${sdpContent}`);
  return sdpContent;
}

/**
 * Legacy SDP generation function for backward compatibility
 * @deprecated Use generateMultiStreamSdp instead
 */
function generateSdp(pairs: TransportConsumerPair[], ports: HlsPorts): string {
  const sdpParts = [
    "v=0",
    "o=- 0 0 IN IP4 127.0.0.1",
    "s=Mediasoup-HLS",
    "c=IN IP4 127.0.0.1",
    "t=0 0",
  ];

  // FIX: Iterate and use the correct ports from the 'ports' object
  for (const { consumer } of pairs) {
    const { rtpParameters, kind } = consumer;
    const codec = rtpParameters.codecs[0];

    // Determine the correct ports based on the media kind
    const rtpPort = kind === 'video' ? ports.videoRtpPort : ports.audioRtpPort;
    const rtcpPort = kind === 'video' ? ports.videoRtcpPort : ports.audioRtcpPort;

    logger.info(`🎬 [SDP] Generating ${kind} track: codec=${codec.mimeType}, payloadType=${codec.payloadType}, clockRate=${codec.clockRate}, parameters=${JSON.stringify(codec.parameters || {})}`);

    sdpParts.push(
      `m=${kind} ${rtpPort} RTP/AVP ${codec.payloadType}`,
      `a=rtcp:${rtcpPort}`,
      `a=sendrecv`,
      `a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}${codec.channels ? `/${codec.channels}` : ""}`,
    );
    
    // Add codec-specific format parameters
    if (codec.parameters && Object.keys(codec.parameters).length > 0) {
      for (const [key, value] of Object.entries(codec.parameters)) {
        sdpParts.push(`a=fmtp:${codec.payloadType} ${key}=${value}`);
      }
    } else if (kind === 'video' && codec.mimeType.toLowerCase().includes('vp8')) {
      // Add default VP8 parameters if none are provided
      logger.warn(`🎬 [SDP] No codec parameters for VP8, adding default max-fr and max-fs`);
      sdpParts.push(`a=fmtp:${codec.payloadType} max-fr=30;max-fs=3600`);
    }
  }
  
  const sdpContent = sdpParts.join("\r\n") + "\r\n";
  logger.info(`🎬 [SDP] Generated SDP content:\n${sdpContent}`);
  return sdpContent;
}

/**
 * Spawns the FFmpeg process with the correct arguments for HLS conversion.
 * @private
 * @param {string} sdpPath - The path to the SDP input file.
 * @param {string} outputDir - The directory where HLS files will be stored.
 * @param {string} roomId - The ID of the room, used for logging context.
 * @returns {ChildProcess} The spawned FFmpeg child process instance.
 */
function runFfmpeg(sdpPath: string, outputDir: string, roomId: string, streamCount: { video: number; audio: number } = { video: 1, audio: 1 }): ChildProcess {
  const playlistPath = path.join(outputDir, "playlist.m3u8");
  const segmentPath = path.join(outputDir, "segment_%03d.ts");

  // Generate the stream mixing configuration first
  const mixingConfig = generateStreamMixingFilters(streamCount);
  
  const args = [
    // Instruct FFmpeg to process the SDP file.
    "-protocol_whitelist", "file,udp,rtp",
    
    // Optimized for low latency - reduced probe/analyze times
    "-analyzeduration", "2000000",   // 2 seconds (reduced from 10)
    "-probesize", "10000000",        // 10MB (reduced from 50MB)
    
    // Low-latency flags
    "-fflags", "+genpts+ignidx+nobuffer",
    "-avoid_negative_ts", "make_zero",
    "-max_delay", "500000",          // 500ms max delay
    
    "-i", sdpPath,

    // Dynamic video and audio mixing based on stream count (includes mapping)
    ...mixingConfig,

    // Video codec settings optimized for real-time low latency
    "-c:v", "libx264",
    "-preset", "ultrafast",          // Fastest encoding preset
    "-tune", "zerolatency",          // Zero latency tuning
    "-crf", "28",                    // Slightly lower quality for speed (was 23)
    "-pix_fmt", "yuv420p",
    "-g", "30",                      // GOP size = 1 second at 30fps (was 60)
    "-keyint_min", "30",             // Minimum GOP size
    "-sc_threshold", "0",            // Disable scene change detection

    // Audio codec settings optimized for low latency
    "-c:a", "aac",
    "-b:a", "96k",                   // Reduced bitrate for lower latency (was 128k)
    "-ar", "48000",
    "-ac", "2",

    // Low-latency HLS output settings
    "-f", "hls",
    "-hls_time", "1",                // 1-second segments (reduced from 2)
    "-hls_list_size", "3",           // Keep only 3 segments (reduced from 5)
    "-hls_flags", "delete_segments+independent_segments", 
    "-hls_segment_type", "mpegts",
    "-hls_allow_cache", "0",         // Disable caching for live streams
    "-start_number", "0",
    "-hls_segment_filename", segmentPath,
    playlistPath,
  ];

  // Log the complete FFmpeg command for debugging
  logger.info(`🎬 [FFmpeg] Complete command: ${FFMPEG_PATH} ${args.join(' ')}`);
  
  const ffmpegProc = spawn(FFMPEG_PATH, args, {
    // Detached mode is not needed here; we manage the lifecycle directly.
    // The 'pipe' option for stdio allows us to capture logs.
    stdio: ["ignore", "pipe", "pipe"],
  });

  // --- Process Event Handling ---
  ffmpegProc.on("error", (err) => {
    logger.error(`[FFmpeg][${roomId}] Failed to start FFmpeg process:`, err);
  });

  ffmpegProc.on("close", (code, signal) => {
    logger.info(`[FFmpeg][${roomId}] Process exited with code ${code} and signal ${signal}.`);
    // If the process exits unexpectedly, you might want to trigger cleanup here.
  });

  // Pipe FFmpeg's stderr to our logger for real-time diagnostics.
  ffmpegProc.stderr.on("data", (data) => {
    const message = data.toString().trim();
    // FFmpeg logs verbosely; filter for important lines or log everything at debug level.
    logger.debug(`[FFmpeg][${roomId}] ${message}`);
  });

  return ffmpegProc;
}

/**
 * Generates dynamic FFmpeg filter arguments for multi-stream composition.
 * @private
 * @param {object} streamCount - Object containing video and audio stream counts
 * @returns {string[]} Array of FFmpeg arguments for stream mixing
 */
function generateStreamMixingFilters(streamCount: { video: number; audio: number }): string[] {
  const { video: videoCount, audio: audioCount } = streamCount;
  
  logger.info(`🎬 [FFmpeg] Generating filters for ${videoCount} video streams and ${audioCount} audio streams`);
  
  const filters: string[] = [];
  
  // Handle video streams
  if (videoCount === 1) {
    // Single video stream - apply scaling and map directly
    filters.push("-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2");
    filters.push("-map", "0:v?");  // Map the single video stream
  } else if (videoCount > 1) {
    // Multiple video streams - create composition
    let videoFilter = "";
    
    // Scale individual video inputs
    for (let i = 0; i < videoCount; i++) {
      videoFilter += `[0:v:${i}]scale=640:360,setpts=PTS-STARTPTS[v${i}]; `;
    }
    
    // Create layout based on number of streams
    if (videoCount === 2) {
      // Side-by-side layout for 2 streams
      videoFilter += `[v0][v1]hstack=inputs=2:shortest=1[vout]`;
    } else if (videoCount <= 4) {
      // 2x2 grid layout for 3-4 streams
      if (videoCount === 3) {
        // Add a blank input for 4th position
        videoFilter += `color=c=black:s=640x360:d=1[v3]; `;
      }
      const bottomIndex = videoCount === 3 ? '3' : (videoCount - 1).toString();
      videoFilter += `[v0][v1]hstack=inputs=2[top]; [v2][v${bottomIndex}]hstack=inputs=2[bottom]; [top][bottom]vstack=inputs=2[vout]`;
    } else {
      // For more than 4 streams, use a simple grid approach
      videoFilter += `[v0][v1]hstack=inputs=2[row1]; `;
      for (let i = 2; i < Math.min(videoCount, 6); i += 2) {
        const nextIndex = i + 1 < videoCount ? i + 1 : i;
        videoFilter += `[v${i}][v${nextIndex}]hstack=inputs=2[row${Math.floor(i/2) + 1}]; `;
      }
      videoFilter += `[row1][row2]vstack=inputs=2[vout]`;
    }
    
    filters.push("-filter_complex", videoFilter);
    filters.push("-map", "[vout]");
  } else {
    // No video streams - this shouldn't happen but handle gracefully
    logger.warn("🎬 [FFmpeg] No video streams available");
  }
  
  // Handle audio streams
  if (audioCount === 1) {
    // Single audio stream - map directly
    filters.push("-map", "0:a?");
  } else if (audioCount > 1) {
    // Multiple audio streams - mix them
    let audioFilter = "";
    const audioInputs = Array.from({ length: audioCount }, (_, i) => `[0:a:${i}]`).join('');
    audioFilter = `${audioInputs}amix=inputs=${audioCount}:duration=longest:dropout_transition=2[aout]`;
    
    if (filters.includes("-filter_complex")) {
      // Append to existing filter_complex
      const complexIndex = filters.indexOf("-filter_complex");
      filters[complexIndex + 1] += `; ${audioFilter}`;
    } else {
      filters.push("-filter_complex", audioFilter);
    }
    filters.push("-map", "[aout]");
  } else {
    // No audio streams - this shouldn't happen but handle gracefully
    logger.warn("🎬 [FFmpeg] No audio streams available");
  }
  
  filters.push("-r", "30"); // Force 30fps
  
  logger.info(`🎬 [FFmpeg] Generated filter arguments:`, filters);
  logger.info(`🎬 [FFmpeg] Full filter string: ${filters.includes('-filter_complex') ? filters[filters.indexOf('-filter_complex') + 1] : 'No complex filter'}`);
  
  return filters;
}