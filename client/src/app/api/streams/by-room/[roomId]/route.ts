import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: {  params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Get server URL from environment or default
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
    
    // Try to fetch the specific stream from the backend server
    const response = await fetch(`${serverUrl}/api/hls/streams/${roomId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.hlsUrl) {
        return NextResponse.json({
          id: roomId,
          roomId: roomId,
          hlsUrl: data.hlsUrl,
          title: data.title || `Stream in Room ${roomId}`,
          isLive: true,
          viewers: data.viewers || 1,
          startedAt: new Date(data.startedAt || Date.now()),
        });
      }
    }
    
    throw new Error(`No active stream found for room ${roomId}`);
  } catch (error) {
    console.error('Error fetching stream by room ID:', error);
    
    return NextResponse.json(
      { 
        error: 'No active stream found for this room code',
        message: 'Make sure the streamers have started and enabled HLS broadcasting'
      },
      { status: 404 }
    );
  }
}
