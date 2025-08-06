import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { sanitizeFilename } from '../utils/helpers';
import env from '../config/environment';
import type { HLSConfig } from '../models/Stream';

export class HLSService {
  private static instance: HLSService;
  private activeStreams: Map<string, any> = new Map();

  public static getInstance(): HLSService {
    if (!HLSService.instance) {
      HLSService.instance = new HLSService();
    }
    return HLSService.instance;
  }

  constructor() {
    // Set FFmpeg path if provided
    if (env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(env.FFMPEG_PATH);
    }
  }

  async startHLSStream(roomId: string, rtmpUrl: string): Promise<string> {
    try {
      const config = this.getHLSConfig(roomId);
      
      // Ensure output directory exists
      await this.ensureDirectoryExists(path.dirname(config.outputPath));

      const playlistPath = path.join(path.dirname(config.outputPath), config.playlistName);

      const command = ffmpeg(rtmpUrl)
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('hls')
        .outputOptions([
          '-hls_time', config.segmentDuration.toString(),
          '-hls_list_size', config.listSize.toString(),
          '-hls_flags', 'delete_segments',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-g', '60',
          '-sc_threshold', '0',
          '-keyint_min', '60',
          '-hls_allow_cache', '1',
          '-hls_segment_filename', config.outputPath,
        ])
        .output(playlistPath)
        .on('start', (commandLine) => {
          logger.info(`HLS transcoding started for room ${roomId}: ${commandLine}`);
        })
        .on('error', (err) => {
          logger.error(`HLS transcoding error for room ${roomId}:`, err);
          this.activeStreams.delete(roomId);
        })
        .on('end', () => {
          logger.info(`HLS transcoding ended for room ${roomId}`);
          this.activeStreams.delete(roomId);
        });

      command.run();
      this.activeStreams.set(roomId, command);

      const playlistUrl = `/hls/${roomId}/playlist.m3u8`;
      logger.info(`HLS stream started for room ${roomId}: ${playlistUrl}`);
      
      return playlistUrl;
    } catch (error) {
      logger.error(`Error starting HLS stream for room ${roomId}:`, error);
      throw new Error('Failed to start HLS stream');
    }
  }

  stopHLSStream(roomId: string): boolean {
    try {
      const command = this.activeStreams.get(roomId);
      if (command) {
        command.kill('SIGKILL');
        this.activeStreams.delete(roomId);
        logger.info(`HLS stream stopped for room ${roomId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error stopping HLS stream for room ${roomId}:`, error);
      return false;
    }
  }

  isStreamActive(roomId: string): boolean {
    return this.activeStreams.has(roomId);
  }

  getPlaylistPath(roomId: string): string {
    const config = this.getHLSConfig(roomId);
    return path.join(path.dirname(config.outputPath), config.playlistName);
  }

  getSegmentPath(roomId: string, segmentName: string): string {
    const config = this.getHLSConfig(roomId);
    return path.join(path.dirname(config.outputPath), segmentName);
  }

  private getHLSConfig(roomId: string): HLSConfig {
    const sanitizedRoomId = sanitizeFilename(roomId);
    const outputDir = path.join(env.HLS_STORAGE_PATH, sanitizedRoomId);
    
    return {
      segmentDuration: 6,
      listSize: 10,
      outputPath: path.join(outputDir, 'segment_%03d.ts'),
      playlistName: 'playlist.m3u8',
    };
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  async cleanupRoomFiles(roomId: string): Promise<void> {
    try {
      const sanitizedRoomId = sanitizeFilename(roomId);
      const outputDir = path.join(env.HLS_STORAGE_PATH, sanitizedRoomId);
      
      if (fs.existsSync(outputDir)) {
        await fs.promises.rmdir(outputDir, { recursive: true });
        logger.info(`Cleaned up HLS files for room ${roomId}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up HLS files for room ${roomId}:`, error);
    }
  }

  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }
}
