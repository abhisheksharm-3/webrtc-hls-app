import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StreamControlProps } from '@/lib/types/ui-types';
import { Mic, MicOff, Video, VideoOff, LogOut, Radio } from 'lucide-react';

export function StreamControls({ 
  mediaDeviceStatus, 
  onToggleMedia, 
  onLeaveRoom, 
  userRole, 
  isStreaming 
}: StreamControlProps) {
  if (!isStreaming) {
    return null; // Don't show controls when not streaming
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Live indicator */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full animate-pulse">
            <Radio className="w-3 h-3 mr-2" />
            LIVE
          </div>
          <span className="text-sm text-muted-foreground">
            {userRole === 'host' ? 'Broadcasting as Host' : 'Joined as Guest'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => onToggleMedia("video")} 
                size="sm" 
                variant={mediaDeviceStatus.video ? "secondary" : "destructive"} 
                className="h-10 w-10 rounded-lg"
              >
                {mediaDeviceStatus.video ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{mediaDeviceStatus.video ? "Turn off camera" : "Turn on camera"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => onToggleMedia("audio")} 
                size="sm" 
                variant={mediaDeviceStatus.audio ? "secondary" : "destructive"} 
                className="h-10 w-10 rounded-lg"
              >
                {mediaDeviceStatus.audio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{mediaDeviceStatus.audio ? "Mute microphone" : "Unmute microphone"}</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-2"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onLeaveRoom} 
                variant="destructive" 
                size="sm"
                className="h-10 px-4 rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leave the stream</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}