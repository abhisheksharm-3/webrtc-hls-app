import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { HLSService } from '../services/HLSService';
import { RoomService } from '../services/RoomService';
import { ParticipantService } from '../services/ParticipantService';
import { logger } from '../utils/logger';
import env from '../config/environment';

const router = Router();
const hlsService = HLSService.getInstance();
const roomService = RoomService.getInstance();
const participantService = ParticipantService.getInstance();

// GET /api/hls/streams - Get all active HLS streams
router.get('/api/streams', async (req: Request, res: Response) => {
  try {
    const rooms = await roomService.getAllRooms();
    const activeStreams = [];

    for (const room of rooms) {
      if (room.hlsUrl && hlsService.isStreamActive(room.id)) {
        const participants = await participantService.getParticipantsByRoomId(room.id);
        const streamingParticipants = participants.filter(p => p.isStreaming);
        
        if (streamingParticipants.length > 0) {
          activeStreams.push({
            id: room.id,
            roomId: room.id,
            hlsUrl: room.hlsUrl,
            title: room.name,
            isLive: true,
            viewers: room.participantCount || 0,
            startedAt: room.createdAt,
          });
        }
      }
    }

    res.json({
      success: true,
      streams: activeStreams,
      total: activeStreams.length,
    });
  } catch (error) {
    logger.error('Error getting HLS streams:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get HLS streams',
    });
  }
});

// GET /api/hls/room/:roomId - Get HLS stream for specific room
router.get('/api/room/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Room not found',
      });
    }

    if (!room.hlsUrl || !hlsService.isStreamActive(roomId)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active HLS stream for this room',
      });
    }

    const participants = await participantService.getParticipantsByRoomId(roomId);
    const streamingParticipants = participants.filter(p => p.isStreaming);

    if (streamingParticipants.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active streamers in this room',
      });
    }

    res.json({
      id: room.id,
      roomId: room.id,
      hlsUrl: room.hlsUrl,
      title: room.name,
      isLive: true,
      viewers: room.participantCount || 0,
      startedAt: room.createdAt,
      participants: streamingParticipants.map(p => ({
        id: p.id,
        isHost: p.isHost,
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio,
      })),
    });
  } catch (error) {
    logger.error('Error getting HLS stream by room:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get HLS stream',
    });
  }
});

// GET /hls/:roomId/playlist.m3u8 - Get HLS playlist
router.get('/:roomId/playlist.m3u8', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const playlistPath = hlsService.getPlaylistPath(roomId);
    
    if (!fs.existsSync(playlistPath)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'HLS playlist not found',
      });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.resolve(playlistPath));
  } catch (error) {
    logger.error('Error serving HLS playlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to serve HLS playlist',
    });
  }
});

// GET /hls/:roomId/segments/:segment - Get HLS segment
router.get('/:roomId/segments/:segment', async (req: Request, res: Response) => {
  try {
    const { roomId, segment } = req.params;
    const segmentPath = hlsService.getSegmentPath(roomId, segment);
    
    if (!fs.existsSync(segmentPath)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'HLS segment not found',
      });
    }

    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(path.resolve(segmentPath));
  } catch (error) {
    logger.error('Error serving HLS segment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to serve HLS segment',
    });
  }
});

// POST /api/rooms/:roomId/hls/start - Start HLS recording
router.post('/api/rooms/:roomId/hls/start', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Room not found',
      });
    }

    if (hlsService.isStreamActive(roomId)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'HLS stream already active for this room',
      });
    }

    // For now, we'll use a placeholder RTMP URL
    // In a real implementation, this would come from the mediasoup plain transport
    const rtmpUrl = `rtmp://localhost:1935/live/${roomId}`;
    const playlistUrl = await hlsService.startHLSStream(roomId, rtmpUrl);

    await roomService.updateRoom(roomId, { hlsUrl: playlistUrl });

    res.json({
      roomId,
      playlistUrl,
      message: 'HLS recording started',
    });
  } catch (error) {
    logger.error('Error starting HLS recording:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start HLS recording',
    });
  }
});

// POST /api/rooms/:roomId/hls/stop - Stop HLS recording
router.post('/api/rooms/:roomId/hls/stop', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const success = hlsService.stopHLSStream(roomId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active HLS stream found for this room',
      });
    }

    await roomService.updateRoom(roomId, { hlsUrl: undefined });

    res.json({
      roomId,
      message: 'HLS recording stopped',
    });
  } catch (error) {
    logger.error('Error stopping HLS recording:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to stop HLS recording',
    });
  }
});

// GET /api/rooms/:roomId/hls - Get HLS info
router.get('/api/rooms/:roomId/hls', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Room not found',
      });
    }

    const isActive = hlsService.isStreamActive(roomId);
    const playlistUrl = room.hlsUrl;

    res.json({
      roomId,
      isActive,
      playlistUrl,
    });
  } catch (error) {
    logger.error('Error getting HLS info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get HLS info',
    });
  }
});

export default router;
