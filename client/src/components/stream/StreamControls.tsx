"use client";

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StreamControlProps } from '@/lib/types/ui-types';
import { Mic, MicOff, Video, VideoOff, LogOut, Radio } from 'lucide-react';

// --- Child Components ---

/**
 * @description A reusable button for toggling media devices (camera, microphone).
 * It encapsulates the button, icon, tooltip, and state-based styling.
 */
const MediaToggleButton = ({
  isActive,
  onToggle,
  IconOn,
  IconOff,
  tooltipOn,
  tooltipOff,
}: {
  isActive: boolean;
  onToggle: () => void;
  IconOn: React.ElementType;
  IconOff: React.ElementType;
  tooltipOn: string;
  tooltipOff: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        onClick={onToggle}
        size="icon" // Use "icon" size for a square button
        variant={isActive ? "secondary" : "destructive"}
        className="h-10 w-10 rounded-lg"
      >
        {isActive ? <IconOn className="w-5 h-5" /> : <IconOff className="w-5 h-5" />}
        <span className="sr-only">{isActive ? tooltipOn : tooltipOff}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{isActive ? tooltipOn : tooltipOff}</p>
    </TooltipContent>
  </Tooltip>
);


// --- Main Component ---

/**
 * @description A component that displays the primary controls for a stream, such as
 * toggling media and leaving the room.
 */
export function StreamControls({
  mediaDeviceStatus,
  onToggleMedia,
  onLeaveRoom,
  userRole,
  isStreaming
}: StreamControlProps) {
  // The host can prepare their media before starting, so we show controls even if !isStreaming for the host.
  // Guests will only see controls once the stream is live.
  if (userRole === 'guest' && !isStreaming) {
    return null;
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-center sm:justify-between px-4 py-3">
        {/* Live indicator (shown on larger screens) */}
        <div className="hidden sm:flex items-center gap-3">
          {isStreaming ? (
            <div className="inline-flex items-center px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full animate-pulse">
              <Radio className="w-3 h-3 mr-2" />
              LIVE
            </div>
          ) : (
             <div className="inline-flex items-center px-3 py-1 text-sm font-semibold text-muted-foreground bg-secondary rounded-full">
              Ready to Stream
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <MediaToggleButton
            isActive={mediaDeviceStatus.video}
            onToggle={() => onToggleMedia("video")}
            IconOn={Video}
            IconOff={VideoOff}
            tooltipOn="Turn off camera"
            tooltipOff="Turn on camera"
          />
          <MediaToggleButton
            isActive={mediaDeviceStatus.audio}
            onToggle={() => onToggleMedia("audio")}
            IconOn={Mic}
            IconOff={MicOff}
            tooltipOn="Mute microphone"
            tooltipOff="Unmute microphone"
          />

          <div className="w-px h-6 bg-border mx-2"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onLeaveRoom}
                variant="destructive"
                className="h-10 px-4 rounded-lg"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Leave</span>
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