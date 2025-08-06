import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Radio, Users } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { PlayerControls } from './PlayerControl';
import { StreamPlayerProps } from '@/lib/types/stream-types';


export const StreamPlayer = ({ currentStream, allStreams, onSelectStream, onPlaybackError }: StreamPlayerProps) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const { videoRef, isPlaying, isMuted, actions } = useHlsPlayer(playerContainerRef, onPlaybackError);

  useEffect(() => {
    if (currentStream) {
      actions.loadSource(currentStream.hlsUrl);
    }
  }, [currentStream, actions.loadSource]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 w-full">
        <div ref={playerContainerRef} className="group/player relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
          <video ref={videoRef} playsInline className="w-full h-full object-cover" />
          <PlayerControls isPlaying={isPlaying} isMuted={isMuted} onPlayPause={actions.togglePlayPause} onMuteToggle={actions.toggleMute} onFullscreen={actions.goFullscreen} />
          {currentStream.isLive && <Badge className="absolute top-4 left-4 bg-red-500/90 border-red-400/50 text-white animate-pulse"><Radio className="w-3 h-3 mr-1.5" />LIVE</Badge>}
        </div>
        <Card className="mt-6 border-white/10 bg-white/5">
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

      <aside className="w-full lg:w-96 flex-shrink-0">
        <Card className="border-white/10 bg-white/5 h-full">
          <CardHeader><CardTitle className="font-serif text-2xl">Live Now</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
            {allStreams.map(s => (
              <div key={s.id} onClick={() => onSelectStream(s)} className={`p-4 rounded-xl cursor-pointer border transition-all ${s.id === currentStream.id ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-transparent hover:border-white/20'}`}>
                <h4 className="font-semibold truncate pr-4">{s.title}</h4>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground"><Users className="w-3 h-3" /> {s.viewers}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};