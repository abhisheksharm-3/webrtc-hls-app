'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Hls from 'hls.js';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { 
  Play, 
  Eye, 
  RefreshCw, 
  Calendar,
  Users,
  Radio,
  Tv,
  AlertCircle,
  PlayCircle
} from 'lucide-react';

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
  const [isDemo, setIsDemo] = useState(false);
  
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
      setIsDemo(data.isDemo || false);
      
      if (data.isDemo) {
        setError('⚠️ Backend server unavailable - showing demo data. Your actual streams will appear when the server is running.');
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
      setError('Failed to load available streams');
      setStreams([]);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center animate-pulse">
              <Tv className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Loading Streams</h3>
              <p className="text-muted-foreground">Discovering available live streams...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Tv className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Live Streams</h1>
                <p className="text-sm text-muted-foreground">
                  {currentStream ? `Watching: ${currentStream.title}` : 'Discover live content from creators'}
                </p>
              </div>
            </div>
            <Button
              onClick={refreshStreams}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Card className={isDemo ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}>
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className={`w-5 h-5 ${isDemo ? "text-yellow-600" : "text-red-600"}`} />
              <p className={isDemo ? "text-yellow-700" : "text-red-700"}>{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video player */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-lg">
              {currentStream ? (
                <>
                  <div className="aspect-video bg-black relative">
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full"
                    />
                    {currentStream.isLive && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{currentStream.title}</h2>
                        <p className="text-muted-foreground">Room: {currentStream.roomId}</p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          {currentStream.isLive ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <Radio className="w-3 h-3 mr-1" />
                              LIVE
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              OFFLINE
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{currentStream.viewers} viewers</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Started {new Date(currentStream.startedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="aspect-video bg-muted/10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Tv className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">Ready to Watch</h3>
                      <p className="text-muted-foreground">Select a stream from the sidebar to start watching</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Stream list */}
          <div>
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Radio className="w-5 h-5 text-primary" />
                  Available Streams ({streams.length})
                </CardTitle>
                <CardDescription>
                  Discover live content from creators and broadcasters
                </CardDescription>
              </CardHeader>
              <CardContent>
                {streams.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                      <Tv className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">No Live Streams</h3>
                      <p className="text-sm text-muted-foreground">
                        {isDemo 
                          ? "Start your backend server to see real active streams"
                          : "No streams are currently available"
                        }
                      </p>
                    </div>
                    <Button
                      onClick={refreshStreams}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {isDemo ? "Check for Real Streams" : "Check Again"}
                    </Button>
                    {isDemo && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-left">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">💡 To see your actual streams:</h4>
                        <ol className="text-xs text-blue-800 space-y-1 ml-4">
                          <li>1. Start your backend server: <code className="bg-blue-100 px-1 rounded">npm run dev:server</code></li>
                          <li>2. Create a new room and start streaming</li>
                          <li>3. Refresh this page to see active streams</li>
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {streams.map((stream) => (
                      <Card
                        key={stream.id}
                        onClick={() => selectStream(stream)}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          currentStream?.id === stream.id
                            ? 'bg-primary/5 border-primary/20 shadow-md'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate mb-1">
                                  {stream.title}
                                  {isDemo && <span className="text-xs text-muted-foreground ml-2">(Demo)</span>}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  Room: {stream.roomId}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                {stream.isLive ? (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-xs">
                                    <Radio className="w-2 h-2 mr-1" />
                                    LIVE
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    OFFLINE
                                  </Badge>
                                )}
                                {currentStream?.id === stream.id && (
                                  <PlayCircle className="w-4 h-4 text-primary" />
                                )}
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{stream.viewers}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(stream.startedAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
