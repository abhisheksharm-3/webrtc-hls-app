'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Hls from 'hls.js';

interface Stream {
  id: string;
  roomId: string;
  hlsUrl: string;
  title: string;
  isLive: boolean;
  viewers: number;
  startedAt: Date;
}

export default function WatchPage() {
  const searchParams = useSearchParams();
  const streamUrl = searchParams.get('stream');
  
  const [streams, setStreams] = useState<Stream[]>([]);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hls, setHls] = useState<Hls | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadDirectStreamHandler = async (url: string) => {
      try {
        setIsLoading(true);
        
        // Create a mock stream object for direct URL
        const mockStream: Stream = {
          id: 'direct',
          roomId: 'direct',
          hlsUrl: url,
          title: 'Direct Stream',
          isLive: true,
          viewers: 0,
          startedAt: new Date()
        };
        
        setCurrentStream(mockStream);
        await initializeHlsPlayer(url);
      } catch (error) {
        console.error('Error loading direct stream:', error);
        setError('Failed to load stream');
      } finally {
        setIsLoading(false);
      }
    };

    if (streamUrl) {
      // Direct stream URL provided
      loadDirectStreamHandler(streamUrl);
    } else {
      // Load available streams
      loadAvailableStreams();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAvailableStreams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/streams/live');
      
      if (!response.ok) {
        throw new Error('Failed to fetch streams');
      }
      
      const data = await response.json();
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Error loading streams:', error);
      setError('Failed to load available streams');
    } finally {
      setIsLoading(false);
    }
  };


  const initializeHlsPlayer = async (streamUrl: string) => {
    if (!videoRef.current) return;

    // Destroy existing HLS instance
    if (hls) {
      hls.destroy();
    }

    if (Hls.isSupported()) {
      const hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
        liveBackBufferLength: 0
      });

      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(videoRef.current);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        videoRef.current?.play().catch(console.error);
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...');
              hlsInstance.recoverMediaError();
              break;
            default:
              console.log('Fatal error, destroying HLS...');
              hlsInstance.destroy();
              setError('Stream playback failed');
              break;
          }
        }
      });

      setHls(hlsInstance);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(console.error);
      });
    } else {
      setError('HLS is not supported in this browser');
    }
  };

  const selectStream = async (stream: Stream) => {
    setCurrentStream(stream);
    setError(null);
    await initializeHlsPlayer(stream.hlsUrl);
  };

  const refreshStreams = () => {
    loadAvailableStreams();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Live Streams</h1>
              <p className="text-gray-600">
                {currentStream ? `Watching: ${currentStream.title}` : 'Select a stream to watch'}
              </p>
            </div>
            <button
              onClick={refreshStreams}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video player */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {currentStream ? (
                <div>
                  <div className="aspect-video bg-gray-900">
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{currentStream.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${currentStream.isLive ? 'bg-red-500' : 'bg-gray-400'}`} />
                        {currentStream.isLive ? 'LIVE' : 'OFFLINE'}
                      </div>
                      <div>👥 {currentStream.viewers} viewers</div>
                      <div>📅 Started {new Date(currentStream.startedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📺</div>
                    <p>Select a stream to start watching</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stream list */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold mb-3">Available Streams ({streams.length})</h3>
            
            {streams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">📭</div>
                <p className="text-sm">No live streams available</p>
                <button
                  onClick={refreshStreams}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Check again
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {streams.map((stream) => (
                  <div
                    key={stream.id}
                    onClick={() => selectStream(stream)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentStream?.id === stream.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{stream.title}</h4>
                      <div className={`w-2 h-2 rounded-full ${stream.isLive ? 'bg-red-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className="text-xs text-gray-600">
                      Room: {stream.roomId}
                    </div>
                    <div className="text-xs text-gray-500">
                      👥 {stream.viewers} • {new Date(stream.startedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
