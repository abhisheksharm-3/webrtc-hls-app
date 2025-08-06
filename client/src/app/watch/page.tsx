'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  RefreshCw, 
  Users,
  Radio,
  Tv,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Video,
  KeyRound
} from 'lucide-react';

// ... (Interface and StreamCard component remain the same)
interface Stream {
  id: string;
  roomId: string;
  hlsUrl: string;
  title: string;
  isLive: boolean;
  viewers: number;
  startedAt: Date;
}

const StreamCard = ({ stream, isSelected, onSelect, isDemo }: { stream: Stream, isSelected: boolean, onSelect: (stream: Stream) => void, isDemo?: boolean }) => (
    <div
      onClick={() => onSelect(stream)}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer border-2 transition-all duration-300 ease-in-out ${
        isSelected ? 'border-primary shadow-[0_0_30px_theme(colors.primary/40%)]' : 'border-white/10 hover:border-primary/50 hover:scale-[1.02] hover:shadow-2xl'
      }`}
    >
      <div className="aspect-video bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Tv className="w-16 h-16 text-white/10 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-5 w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-serif text-xl font-bold text-white truncate group-hover:text-primary transition-colors">{stream.title}</h3>
          {stream.isLive && (
            <Badge className="bg-red-500/90 border border-red-400/50 text-white shadow-lg"><Radio className="w-3 h-3 mr-1.5" />LIVE</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-white/70">
          <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />{stream.viewers} Viewers</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(stream.startedAt).toLocaleTimeString()}</div>
        </div>
        {isDemo && !isSelected && <Badge variant="secondary" className="absolute top-4 left-4 text-xs bg-white/10 border-white/20">Demo</Badge>}
      </div>
    </div>
  );


export default function WatchPage() {
  const searchParams = useSearchParams();
  const streamUrl = searchParams.get('stream');
  
  const [streams, setStreams] = useState<Stream[]>([]);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hls, setHls] = useState<Hls | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  
  // State for Player Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // State for Join Dialog
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamUrl) {
      const mockStream: Stream = { id: 'direct', roomId: 'direct', hlsUrl: streamUrl, title: 'Direct HLS Stream', isLive: true, viewers: 1, startedAt: new Date() };
      setStreams([mockStream]);
      setCurrentStream(mockStream);
      initializeHlsPlayer(streamUrl);
    } else {
      loadAvailableStreams();
    }
    return () => hls?.destroy();
  }, [streamUrl, hls]);  const loadAvailableStreams = async () => { /* ... (logic remains the same) ... */ 
    try {
      setIsLoading(true);
      const response = await fetch('/api/streams/live');
      if (!response.ok) throw new Error('Failed to fetch streams');
      const data = await response.json();
      setStreams(data.streams || []);
      setIsDemo(data.isDemo || false);
      if (data.isDemo && data.streams.length === 0) {
        setError('⚠️ Backend server unavailable - showing demo data. Start your server to see real streams.');
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

  const initializeHlsPlayer = async (url: string) => { /* ... (logic remains the same) ... */
    if (!videoRef.current) return;
    hls?.destroy();
    if (Hls.isSupported()) {
      const hlsInstance = new Hls({ lowLatencyMode: true });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoRef.current);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => setIsPlaying(false));
      });
      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream playback failed. The stream may have ended.');
          hlsInstance.destroy();
        }
      });
      setHls(hlsInstance);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(() => setIsPlaying(false));
      });
    } else {
      setError('HLS is not supported in this browser');
    }
  };

  const selectStream = async (stream: Stream) => {
    setCurrentStream(stream);
    setError(null);
    setIsPlaying(true);
    await initializeHlsPlayer(stream.hlsUrl);
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;
    setJoinError(null);
    try {
      // Try to find an active stream for this room code
      const response = await fetch(`/api/streams/by-room/${joinCode.trim()}`);
      if (!response.ok) {
        throw new Error('No active stream found for this room code.');
      }
      const stream: Stream = await response.json();
      selectStream(stream);
      setIsJoinDialogOpen(false);
      setJoinCode('');
    } catch (err) {
      setJoinError('No active stream found for this room code. Make sure the streamers have started and enabled HLS.');
      console.error(err);
    }
  };

  // ... (handlePlayPause, handleMuteToggle, handleFullscreen functions remain the same)
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };
  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }
  const handleFullscreen = () => {
    if (playerContainerRef.current?.requestFullscreen) {
      playerContainerRef.current.requestFullscreen();
    }
  };


  if (isLoading) { /* ... (Loading component remains the same) ... */ 
    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.03),transparent_80%)]"></div>
            <header className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"><Video className="h-6 w-6 text-primary-foreground" /></div>
                  <div><div className="font-serif text-2xl font-bold tracking-tight">Streamify</div><p className="text-xs text-muted-foreground">Watch Live</p></div>
                </Link>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse"></div>
                ))}
            </div>
        </div>
      );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.03),transparent_80%)]"></div>
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl">
          <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform duration-300 group-hover:scale-105"><Video className="h-6 w-6 text-primary-foreground" /></div>
              <div><div className="font-serif text-2xl font-bold tracking-tight">Streamify</div><p className="text-xs text-muted-foreground">Watch Live</p></div>
            </Link>
            <Button onClick={loadAvailableStreams} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10"><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          </div>
        </header>

        <main className="container max-w-screen-2xl px-4 py-6">
          {error && (
            <Card className={`mb-6 border-opacity-30 bg-opacity-10 ${isDemo ? 'border-amber-400 bg-amber-400' : 'border-destructive bg-destructive'}`}>
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDemo ? 'text-amber-300' : 'text-destructive'}`} />
                <p className={`text-sm font-medium ${isDemo ? 'text-amber-200' : 'text-destructive-foreground'}`}>{error}</p>
              </CardContent>
            </Card>
          )}

          {!currentStream ? (
            // --- Browse View ---
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <h1 className="font-serif text-5xl font-bold tracking-tight mb-4 sm:mb-0">Discover Live Streams</h1>
                
                {/* --- JOIN WITH CODE DIALOG --- */}
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 text-base bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105">
                      <KeyRound className="w-5 h-5 mr-2.5"/>Join with Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-background/80 border-border/30 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-2xl">Join a Private Stream</DialogTitle>
                      <DialogDescription>Enter the room code provided by the creator to join.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="room-code" className="font-mono text-sm">Room Code</Label>
                        <Input
                          id="room-code"
                          placeholder="e.g., abc-123-xyz"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleJoinWithCode()}
                          className="h-12 bg-background/50 border-border/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0"
                        />
                        {joinError && <p className="text-sm text-red-400">{joinError}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleJoinWithCode} disabled={!joinCode.trim()}>Join Stream</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </div>
              {streams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {streams.map(s => <StreamCard key={s.id} stream={s} isSelected={false} onSelect={selectStream} isDemo={isDemo} />)}
                </div>
              ) : (
                <Card className="border border-white/10 bg-white/5 backdrop-blur-md text-center py-20">
                  <CardContent>
                    <Tv className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h2 className="text-2xl font-bold font-serif">No Streams Are Live</h2>
                    <p className="text-muted-foreground mt-2 mb-6">Check back later or refresh to see if new streams are available.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // --- Player View ---
            <div className="flex flex-col lg:flex-row gap-6">
              {/* ... (Player View JSX remains the same) ... */}
              <div className="flex-1 w-full">
                <div ref={playerContainerRef} className="group/player relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                  <video ref={videoRef} muted={isMuted} playsInline className="w-full h-full object-cover" onClick={handlePlayPause} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                  
                  {/* Custom Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button onClick={handlePlayPause} variant="ghost" className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20">
                      {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Button onClick={handlePlayPause} variant="ghost" size="icon"><Tooltip><TooltipTrigger asChild>{isPlaying ? <Pause className="w-5 h-5 text-white"/> : <Play className="w-5 h-5 text-white"/>}</TooltipTrigger><TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent></Tooltip></Button>
                           <Button onClick={handleMuteToggle} variant="ghost" size="icon"><Tooltip><TooltipTrigger asChild>{isMuted ? <VolumeX className="w-5 h-5 text-white"/> : <Volume2 className="w-5 h-5 text-white"/>}</TooltipTrigger><TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent></Tooltip></Button>
                        </div>
                        <Button onClick={handleFullscreen} variant="ghost" size="icon"><Tooltip><TooltipTrigger asChild><Maximize className="w-5 h-5 text-white"/></TooltipTrigger><TooltipContent>Fullscreen</TooltipContent></Tooltip></Button>
                    </div>
                  </div>
                  
                  {currentStream.isLive && <Badge className="absolute top-4 left-4 bg-red-500/90 border border-red-400/50 text-white animate-pulse shadow-lg"><Radio className="w-3 h-3 mr-1.5" />LIVE</Badge>}
                </div>
                <Card className="mt-6 border border-white/10 bg-white/5 backdrop-blur-md">
                   <CardHeader>
                      <CardTitle className="font-serif text-4xl">{currentStream.title}</CardTitle>
                      <CardDescription className="font-mono text-sm">Room ID: {currentStream.roomId}</CardDescription>
                   </CardHeader>
                   <CardContent className="flex items-center gap-6 font-mono text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> {currentStream.viewers} Viewers</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Started at {new Date(currentStream.startedAt).toLocaleTimeString()}</div>
                   </CardContent>
                </Card>
              </div>

              {/* The Playlist */}
              <aside className="w-full lg:w-96 flex-shrink-0">
                <Card className="border border-white/10 bg-white/5 backdrop-blur-md h-full">
                  <CardHeader><CardTitle className="font-serif text-2xl">Live Now</CardTitle></CardHeader>
                  <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {streams.map(s => (
                       <div key={s.id} onClick={() => selectStream(s)} className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 ${s.id === currentStream.id ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-transparent hover:border-white/20'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold text-foreground truncate pr-4">{s.title}</h4>
                            {s.isLive && <Badge className="text-xs" variant={s.id === currentStream.id ? "default" : "destructive"}>LIVE</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            <Users className="w-3 h-3" /> {s.viewers}
                          </div>
                       </div>
                    ))}
                  </CardContent>
                </Card>
              </aside>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}