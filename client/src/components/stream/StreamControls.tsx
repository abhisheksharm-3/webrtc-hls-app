import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StreamControlProps } from '@/lib/types/ui-types';
import { Mic, MicOff, Video, VideoOff, Square, Radio } from 'lucide-react';


export function StreamControls({ mediaStatus, onToggleMedia, onStopStreaming }: StreamControlProps) {
  return (
    <>
      <div className="absolute top-6 left-6 z-10">
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full shadow-lg animate-pulse">
            <Radio className="w-4 h-4 mr-2" /> LIVE
        </span>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto z-10">
        <div className="flex items-center gap-3 rounded-2xl p-3 bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl">
          <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={() => onToggleMedia("video")} size="icon" variant={mediaStatus.video ? "secondary" : "destructive"} className="h-12 w-12 rounded-lg">
                    {mediaStatus.video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>{mediaStatus.video ? "Turn off camera" : "Turn on camera"}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={() => onToggleMedia("audio")} size="icon" variant={mediaStatus.audio ? "secondary" : "destructive"} className="h-12 w-12 rounded-lg">
                    {mediaStatus.audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>{mediaStatus.audio ? "Mute microphone" : "Unmute microphone"}</p></TooltipContent>
          </Tooltip>
          <div className="w-px h-8 bg-white/20 mx-2"></div>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={onStopStreaming} variant="destructive" className="h-12 w-28 rounded-lg text-base">
                    <Square className="w-5 h-5 mr-2" />End
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>End the stream for everyone</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}