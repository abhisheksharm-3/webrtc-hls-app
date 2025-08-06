import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get server URL from environment or default
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
    
    // Try to fetch live streams from the backend server
    const response = await fetch(`${serverUrl}/api/hls/streams`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    
    throw new Error(`Server responded with ${response.status}`);
  } catch (error) {
    console.error('Error fetching streams from backend:', error);
    
    // Return mock data with more realistic examples
    const mockStreams = [
      {
        id: 'demo-1',
        roomId: 'demo-room-1',
        hlsUrl: 'https://demo-streams.example.com/stream1.m3u8',
        title: 'Tech Talk: Building Real-time Applications',
        isLive: true,
        viewers: 127,
        startedAt: new Date(Date.now() - 2400000), // 40 minutes ago
      },
      {
        id: 'demo-2',
        roomId: 'demo-room-2',
        hlsUrl: 'https://demo-streams.example.com/stream2.m3u8',
        title: 'Live Coding Session: Next.js & TypeScript',
        isLive: true,
        viewers: 89,
        startedAt: new Date(Date.now() - 1200000), // 20 minutes ago
      },
      {
        id: 'demo-3',
        roomId: 'demo-room-3',
        hlsUrl: 'https://demo-streams.example.com/stream3.m3u8',
        title: 'Gaming Stream: Indie Game Development',
        isLive: false,
        viewers: 0,
        startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      }
    ];

    return NextResponse.json({
      success: true,
      streams: mockStreams,
      message: 'Backend server unavailable - showing demo data',
      isDemo: true
    });
  }
}
