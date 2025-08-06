// /components/watch/ui/PlayerControls.tsx
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlayerControlProps } from '@/lib/types/ui-types';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

export const PlayerControls = ({ isPlaying, isMuted, onPlayPause, onMuteToggle, onFullscreen }: PlayerControlProps) => (
  <>
    {/* Center Play/Pause button */}
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex items-center justify-center">
      <Button onClick={onPlayPause} variant="ghost" className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20">
        {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
      </Button>
    </div>
    {/* Bottom control bar */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tooltip><TooltipTrigger asChild><Button onClick={onPlayPause} variant="ghost" size="icon">{isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}</Button></TooltipTrigger><TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button onClick={onMuteToggle} variant="ghost" size="icon">{isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}</Button></TooltipTrigger><TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent></Tooltip>
        </div>
        <Tooltip><TooltipTrigger asChild><Button onClick={onFullscreen} variant="ghost" size="icon"><Maximize className="w-5 h-5 text-white" /></Button></TooltipTrigger><TooltipContent>Fullscreen</TooltipContent></Tooltip>
      </div>
    </div>
  </>
);