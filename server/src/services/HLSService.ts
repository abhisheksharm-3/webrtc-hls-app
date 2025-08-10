/**
 * @file Manages the FFmpeg process for converting Mediasoup streams to HLS.
 */
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { types as mediasoupTypes } from 'mediasoup';
import { LiveRoom } from '../models/Room';
import { logger } from '../utils/logger';
import env from '../config/environment';
import { ChildProcess } from 'child_process';

// Set FFmpeg path from environment variables if provided.
if (env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(env.FFMPEG_PATH);
}

const HLS_STORAGE_PATH = env.HLS_STORAGE_PATH;

// Interface for HLS data stored in room
interface HlsData {
  transports: mediasoupTypes.PlainTransport[];
  consumers: mediasoupTypes.Consumer[];
  sdpPath: string;
}

// Interface to track transport-consumer pairs
interface TransportConsumerPair {
  transport: mediasoupTypes.PlainTransport;
  consumer: mediasoupTypes.Consumer;
}

/**
 * Starts the HLS recording process for a given room.
 * This function creates Mediasoup PlainTransports, generates an SDP file describing
 * the media streams, and spawns an FFmpeg process to create the HLS broadcast.
 *
 * @param room - The LiveRoom instance to be recorded.
 * @returns A promise that resolves with the public URL of the HLS playlist.
 */
export async function startRecording(room: LiveRoom): Promise<{ playlistUrl: string }> {
  // --- 1. Select producers to include in the HLS stream ---
  // We support up to 2 video and up to 2 audio producers and composite them.
  const allProducers = Array.from(room.participants.values())
    .flatMap(p => Array.from((p as any)['producers'].values() as mediasoupTypes.Producer[]))
    .filter(p => !p.closed);

  const videoProducers = allProducers.filter(p => p.kind === 'video').slice(0, 2);
  const audioProducers = allProducers.filter(p => p.kind === 'audio').slice(0, 2);

  if (videoProducers.length === 0) {
    throw new Error(`No video producers available in room ${room.id}`);
  }
  if (audioProducers.length === 0) {
    throw new Error(`No audio producers available in room ${room.id}`);
  }

  // --- 2. Create Mediasoup PlainTransports and Consumers ---
  // Order producers so ffmpeg stream indices are predictable: all videos first, then audios
  const orderedProducers: mediasoupTypes.Producer[] = [...videoProducers, ...audioProducers];
  const { transports, consumers, pairs } = await createHlsTransportsAndConsumers(room.router, orderedProducers);
  
  // --- 3. Generate an SDP file for FFmpeg ---
  const sdpString = generateSdp(pairs);
  const sdpPath = path.join(HLS_STORAGE_PATH, `${room.id}.sdp`);
  await fs.promises.writeFile(sdpPath, sdpString);

  // --- 4. Configure HLS output paths ---
  const hlsOutputPath = path.join(HLS_STORAGE_PATH, room.id);
  await fs.promises.mkdir(hlsOutputPath, { recursive: true });
  const playlistPath = path.join(hlsOutputPath, 'playlist.m3u8');
  
  // --- 5. Spawn the FFmpeg process ---
  const command = ffmpeg(sdpPath)
    .inputOptions(['-protocol_whitelist', 'file,udp,rtp'])
    .videoCodec('libx264')
    .audioCodec('aac');

  // Build complex filter: scale and hstack videos, mix audios
  const hasTwoVideos = videoProducers.length >= 2;
  const hasTwoAudios = audioProducers.length >= 2;

  const complexFilters: any[] = [];
  const videoOutLabel = 'vout';
  const audioOutLabel = 'aout';

  if (hasTwoVideos) {
    // 0:v:0, 0:v:1 from SDP
    complexFilters.push('[0:v:0]scale=960:540[v0]');
    complexFilters.push('[0:v:1]scale=960:540[v1]');
    complexFilters.push('[v0][v1]hstack=inputs=2[' + videoOutLabel + ']');
  } else {
    // Single video, still scale to 1280x720
    complexFilters.push('[0:v:0]scale=1280:720[' + videoOutLabel + ']');
  }

  if (hasTwoAudios) {
    complexFilters.push('[0:a:0][0:a:1]amix=inputs=2:duration=longest:dropout_transition=3[' + audioOutLabel + ']');
  } else {
    // Pass through single audio
    // Map later directly from 0:a:0
  }

  if (complexFilters.length > 0) {
    command.complexFilter(complexFilters);
  }

  // Output mapping and HLS settings
  const outputOptions = [
    '-map', '[' + videoOutLabel + ']',
    ...(hasTwoAudios ? ['-map', '[' + audioOutLabel + ']'] : ['-map', '0:a:0']),
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-hls_time', '4',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments',
  ];

  command.outputOptions(outputOptions).output(playlistPath);

  command
    .on('start', (cmd) => logger.info(`HLS transcoding started for room ${room.id}: ${cmd}`))
    .on('error', (err) => logger.error(`HLS transcoding error for room ${room.id}:`, err))
    .on('end', () => logger.info(`HLS transcoding ended for room ${room.id}`));

  // Store reference to the underlying child process
  let ffmpegProcess: ChildProcess | undefined;
  
  // Get the process after running
  command.on('start', () => {
    // Access the internal process - this is a workaround since ffmpegProc doesn't exist
    ffmpegProcess = (command as any)._getArguments ? (command as any)._getArguments() : undefined;
    if ((command as any).ffmpegProc) {
      ffmpegProcess = (command as any).ffmpegProc;
    }
  });

  command.run();
  
  // --- 6. Store references for cleanup ---
  room.hlsProcess = ffmpegProcess;

  // Store HLS data for cleanup in room.appData.hls
  room.appData.hls = {
    transports,
    consumers,
    sdpPath,
  } as HlsData;

  const playlistUrl = `/hls/${room.id}/playlist.m3u8`;
  return { playlistUrl };
}

/**
 * Stops the HLS recording for a given room.
 * It kills the FFmpeg process, closes the Mediasoup transports, and cleans up files.
 * @param room - The LiveRoom instance to stop recording.
 */
export async function stopRecording(room: LiveRoom): Promise<void> {
  if (room.hlsProcess) {
    logger.info(`Stopping HLS stream for room ${room.id}`);
    room.hlsProcess.kill('SIGKILL');
    room.hlsProcess = undefined;
  }

  // Close the associated Mediasoup transports and consumers
  const hlsData = room.appData.hls as HlsData | undefined;
  if (hlsData) {
    // Close consumers first
    hlsData.consumers?.forEach((consumer: mediasoupTypes.Consumer) => {
      if (!consumer.closed) {
        consumer.close();
      }
    });
    
    // Then close transports
    hlsData.transports?.forEach((transport: mediasoupTypes.Transport) => {
      if (!transport.closed) {
        transport.close();
      }
    });

    // Clean up the SDP file
    if (hlsData.sdpPath) {
      await fs.promises.unlink(hlsData.sdpPath).catch(err => {
        logger.warn(`Failed to delete SDP file: ${err.message}`);
      });
    }
    
    // Clear the HLS data
    room.appData.hls = undefined as any;
  }

  // Clean up HLS segment files
  const hlsOutputPath = path.join(HLS_STORAGE_PATH, room.id);
  await fs.promises.rm(hlsOutputPath, { recursive: true, force: true }).catch(err => {
    logger.warn(`Failed to delete HLS output directory: ${err.message}`);
  });
}


// --- Private Helper Functions ---

async function createHlsTransportsAndConsumers(router: mediasoupTypes.Router, producers: mediasoupTypes.Producer[]) {
    const transports: mediasoupTypes.PlainTransport[] = [];
    const consumers: mediasoupTypes.Consumer[] = [];
    const pairs: TransportConsumerPair[] = [];

    for (const producer of producers) {
        const transport = await router.createPlainTransport({
            listenIp: { ip: '127.0.0.1' }, // Listen locally for FFmpeg
            rtcpMux: false,
            comedia: true
        });
        transports.push(transport);

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities: router.rtpCapabilities,
            paused: false,
        });
        consumers.push(consumer);
        
        // Store the transport-consumer pair for SDP generation
        pairs.push({ transport, consumer });
    }
    return { transports, consumers, pairs };
}

function generateSdp(pairs: TransportConsumerPair[]): string {
    const sdpParts = [
        'v=0',
        'o=- 0 0 IN IP4 127.0.0.1',
        's=FFmpeg',
        'c=IN IP4 127.0.0.1',
        't=0 0'
    ];

    for (const { transport, consumer } of pairs) {
        // Access the transport's tuple directly since we have the transport reference
        const localPort = transport.tuple?.localPort;
        
        if (!localPort) {
            logger.warn(`No local port found for consumer ${consumer.id}`);
            continue;
        }
        
        const codec = consumer.rtpParameters.codecs[0];
        const mediaPart = [
            `m=${consumer.kind} ${localPort} RTP/AVP ${codec.payloadType}`,
            `a=rtpmap:${codec.payloadType} ${codec.mimeType.split('/')[1]}/${codec.clockRate}` + (codec.channels ? `/${codec.channels}` : '')
        ];
        sdpParts.push(...mediaPart);
    }

    return sdpParts.join('\r\n');
}