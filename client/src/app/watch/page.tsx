'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Video } from 'lucide-react';
import Link from 'next/link';
import { StreamMetadata } from '@/lib/types/stream-types';
import { WatchHeader } from '@/components/watch/WatchHeader';
import { StreamBrowser } from '@/components/watch/StreamBrowser';
import { StreamPlayer } from '@/components/watch/StreamPlayer';

const LoadingSkeleton = () => (
    <div className="min-h-screen bg-background text-foreground p-8">
        <header className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary"><Video className="h-6 w-6 text-primary-foreground" /></div><div><div className="font-serif text-2xl font-bold">Streamify</div><p className="text-xs text-muted-foreground">Watch Live</p></div></Link>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse"></div>))}
        </div>
    </div>
);

// Separate component that uses useSearchParams
function WatchContent() {
  const searchParams = useSearchParams();
  const directStreamUrl = searchParams.get('stream');
  const directRoomCode = searchParams.get('room');

  const [streams, setStreams] = useState<StreamMetadata[]>([]);
  const [currentStream, setCurrentStream] = useState<StreamMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const loadAvailableStreams = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/streams/live');
      if (!response.ok) throw new Error('Backend server is not available.');
      const data = await response.json();
      setStreams(data.streams || []);
      setIsDemo(data.isDemo || false);
      if (data.isDemo && data.streams.length === 0) {
        setError('⚠️ Backend server unavailable - showing demo data. Start your server to see real streams.');
      }
    } catch (err: unknown) {
      console.error('Error loading streams:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to load available streams.');
      } else {
        setError('Failed to load available streams.');
      }
      setStreams([]); // Ensure streams are cleared on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectStreamByCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/streams/by-room/${code}`);
      if (!response.ok) return false;
      const stream: StreamMetadata = await response.json();
      setCurrentStream(stream);
      // If the found stream isn't in the main list, add it.
      if (!streams.find(s => s.id === stream.id)) {
        setStreams(prev => [stream, ...prev]);
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [streams]);

  useEffect(() => {
    if (directStreamUrl) {
      const mockStream: StreamMetadata = { id: 'direct', roomId: 'direct', hlsUrl: directStreamUrl, title: 'Direct HLS Stream', isLive: true, viewers: 1, startedAt: new Date() };
      setStreams([mockStream]);
      setCurrentStream(mockStream);
      setIsLoading(false);
    } else if (directRoomCode) {
      selectStreamByCode(directRoomCode).finally(() => setIsLoading(false));
    } else {
      loadAvailableStreams();
    }
  }, [directStreamUrl, directRoomCode, loadAvailableStreams, selectStreamByCode]);

  const handleSelectStream = (stream: StreamMetadata) => {
    setError(null);
    setCurrentStream(stream);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.03),transparent_80%)]"></div>
      <WatchHeader onRefresh={loadAvailableStreams} />

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
          <StreamBrowser streams={streams} isDemo={isDemo} onSelectStream={handleSelectStream} onJoinWithCode={selectStreamByCode} />
        ) : (
          <StreamPlayer currentStream={currentStream} allStreams={streams} onSelectStream={handleSelectStream} onPlaybackError={setError} />
        )}
      </main>
    </div>
  );
}

// Main component that wraps WatchContent in Suspense
export default function WatchPage() {
  return (
    <TooltipProvider>
      <Suspense fallback={<LoadingSkeleton />}>
        <WatchContent />
      </Suspense>
    </TooltipProvider>
  );
}