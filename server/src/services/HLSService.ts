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
  if (room.hlsProcess) {
    throw new Error(`HLS recording is already in progress for room ${room.id}`);
  }

  logger.info(`[HLS] Starting HLS recording for room ${room.id}...`);

  try {
    // 1. Ensure HLS output directory exists and is writable
    const absoluteHlsPath = await ensureHlsDirectory();
    const hlsOutputDir = path.join(absoluteHlsPath, room.id);
    await fs.promises.mkdir(hlsOutputDir, { recursive: true });

    // 2. Select the first available audio and video producers
    const { videoProducer, audioProducer } = selectProducers(room);
    
    // Check if we have at least one producer (audio-only streams are acceptable)
    if (!videoProducer && !audioProducer) {
      throw new Error(`No active producers found in room ${room.id}. Cannot start HLS stream.`);
    }
    
    // Filter out undefined producers for the consumer creation
    const availableProducers = [videoProducer, audioProducer].filter(Boolean) as mediasoupTypes.Producer[];
    
    if (availableProducers.length === 0) {
      throw new Error(`No valid producers available for HLS in room ${room.id}`);
    }
    
    logger.info(`🎬 [HLS] Starting HLS with ${availableProducers.length} producer(s): ${availableProducers.map(p => p.kind).join(', ')}`);

    // 3. Find available network ports for RTP/RTCP
    const hlsPorts = await findAvailablePorts();
    logger.info(`[HLS] Found available ports for room ${room.id}: ${JSON.stringify(hlsPorts)}`);

    // 4. Create Mediasoup transports and consumers
    const { transports, consumers, pairs } =
      await createRtpTransportsAndConsumers(
        room.router,
        availableProducers,
        hlsPorts,
      );
    logger.info(`[HLS] Created ${transports.length} transports and ${consumers.length} consumers.`);

    // 5. Generate and write the SDP file for FFmpeg
    const sdpPath = path.join(hlsOutputDir, "stream.sdp");
    // FIX: Pass the hlsPorts object to generateSdp
    const sdpString = generateSdp(pairs, hlsPorts);
    await fs.promises.writeFile(sdpPath, sdpString);
    logger.info(`[HLS] Generated SDP file at ${sdpPath}`);

    // 6. Resume consumers to start data flow
    await Promise.all(consumers.map((c) => c.resume()));
    logger.info("[HLS] Resumed all consumers.");

    // 7. Spawn the FFmpeg process
    const ffmpegProcess = runFfmpeg(sdpPath, hlsOutputDir, room.id);
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
        room.hlsProcess = undefined;
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
 * Selects the first active video and audio producers from the room.
 * @private
 * @param {LiveRoom} room - The room to select producers from.
 * @returns {{ videoProducer: mediasoupTypes.Producer; audioProducer: mediasoupTypes.Producer }} The selected producers.
 * @throws If either a video or audio producer is not found.
 */
function selectProducers(room: LiveRoom): {
  videoProducer?: mediasoupTypes.Producer;
  audioProducer?: mediasoupTypes.Producer;
} {
  const allProducers = Array.from(room.participants.values()).flatMap((p) =>
    Array.from((p as any)["producers"].values() as mediasoupTypes.Producer[]),
  ).filter((p) => !p.closed && !p.paused);

  const videoProducer = allProducers.find((p) => p.kind === "video");
  const audioProducer = allProducers.find((p) => p.kind === "audio");

  logger.info(`🎬 [HLS] Available producers: ${allProducers.map(p => `${p.kind}(${p.id.substring(0,8)})`).join(', ')}`);
  logger.info(`🎬 [HLS] Selected producers: Video=${videoProducer ? videoProducer.id.substring(0,8) : 'NONE'}, Audio=${audioProducer ? audioProducer.id.substring(0,8) : 'NONE'}`);

  // Log missing producer types for debugging
  const missingTypes = [];
  if (!videoProducer) missingTypes.push('video');
  if (!audioProducer) missingTypes.push('audio');
  
  if (missingTypes.length > 0) {
    logger.warn(`🎬 [HLS] Missing producer types: ${missingTypes.join(', ')}. Available: ${allProducers.map(p => p.kind).join(', ')}`);
  }

  return { videoProducer, audioProducer };
}

/**
 * Finds a set of four available, sequential UDP ports for RTP and RTCP.
 * @private
 * @returns {Promise<HlsPorts>} A promise resolving to an object of available ports.
 */
async function findAvailablePorts(): Promise<HlsPorts> {
  // Use a high port range to avoid conflicts with common services.
  portfinder.setBasePort(40000);

  const findPort = () => portfinder.getPortPromise();

  // Find four distinct ports. portfinder prevents reuse within the same process.
  const ports = await Promise.all([findPort(), findPort(), findPort(), findPort()]);

  return {
    videoRtpPort: ports[0],
    videoRtcpPort: ports[1],
    audioRtpPort: ports[2],
    audioRtcpPort: ports[3],
  };
}

/**
 * Creates Mediasoup PlainTransports and Consumers for HLS ingestion.
 * @private
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
 * Generates an SDP (Session Description Protocol) string for FFmpeg.
 * This file tells FFmpeg where to listen for the audio and video RTP streams.
 * @private
 * @param {TransportConsumerPair[]} pairs - The transport-consumer pairs.
 * @param {HlsPorts} ports - The allocated ports for the HLS stream.
 * @returns {string} The generated SDP content.
 */
// FIX: Add HlsPorts to the function signature
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
function runFfmpeg(sdpPath: string, outputDir: string, roomId: string): ChildProcess {
  const playlistPath = path.join(outputDir, "playlist.m3u8");
  const segmentPath = path.join(outputDir, "segment_%03d.ts");

  const args = [
    // Instruct FFmpeg to process the SDP file.
    "-protocol_whitelist", "file,udp,rtp",
    
    // Increase probe size and analyze duration to better detect video streams
    "-analyzeduration", "10000000",  // 10 seconds (increased)
    "-probesize", "50000000",        // 50MB (increased significantly)
    
    // Force FFmpeg to wait for keyframes and properly analyze streams
    "-fflags", "+genpts+ignidx",
    "-avoid_negative_ts", "make_zero",
    
    "-i", sdpPath,

    // Explicitly map both video and audio streams
    "-map", "0:v?",  // Map video if available (? makes it optional)
    "-map", "0:a?",  // Map audio if available (? makes it optional)

    // Video codec settings - handle VP8 streams without dimensions
    "-c:v", "libx264",
    "-preset", "ultrafast",  // Fastest preset for real-time
    "-tune", "zerolatency",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    
    // Enhanced video filter for VP8 streams without size info
    "-vf", "scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2",
    "-r", "30", // Force 30fps
    "-g", "60", // GOP size (2 seconds at 30fps)
    "-keyint_min", "30", // Minimum keyframe interval

    // Audio codec settings
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "48000", // Force sample rate
    "-ac", "2",     // Force stereo

    // HLS output settings
    "-f", "hls",
    "-hls_time", "2", // 2-second segments
    "-hls_list_size", "5", // Keep 5 segments in the playlist
    "-hls_flags", "delete_segments", // Delete old segments
    "-hls_segment_filename", segmentPath,
    playlistPath,
  ];

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