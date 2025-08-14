"use client";

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StreamControlProps } from '@/lib/types/ui-types';
import { Mic, MicOff, Video, VideoOff, LogOut, Radio } from 'lucide-react';
import React from 'react';

// --- Reusable Sub-Components ---

/**
 * A reusable button for toggling media devices.
 */
const MediaToggleButton = ({
  isActive,
  onToggle,
  IconOn,
  IconOff,
  tooltip,
}: {
  isActive: boolean;
  onToggle: () => void;
  IconOn: React.ElementType;
  IconOff: React.ElementType;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        onClick={onToggle}
        size="icon"
        variant={isActive ? "secondary" : "destructive"}
        className="h-10 w-10 rounded-lg"
        aria-label={isActive ? `Disable ${tooltip}` : `Enable ${tooltip}`}
      >
        {isActive ? <IconOn className="w-5 h-5" /> : <IconOff className="w-5 h-5" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{isActive ? `Disable ${tooltip}` : `Enable ${tooltip}`}</p>
    </TooltipContent>
  </Tooltip>
);

/**
 * A visual indicator showing the stream's current status (Live or Ready).
 */
const LiveIndicator = ({ isStreaming }: { isStreaming: boolean }) => {
  if (isStreaming) {
    return (
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full animate-pulse">
        <Radio className="w-3 h-3" />
        LIVE
      </div>
    );
  }
  return (
    <div className="hidden sm:flex items-center px-3 py-1 text-sm font-semibold text-muted-foreground bg-secondary rounded-full">
      Ready to Stream
    </div>
  );
};

/**
 * A styled button for leaving the stream room.
 */
const LeaveButton = ({ onLeaveRoom }: { onLeaveRoom: () => void }) => (
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
);


// --- Main Component ---

/**
 * A component that displays the primary controls for a stream.
 */
export function StreamControls({
  mediaDeviceStatus,
  onToggleMedia,
  onLeaveRoom,
  userRole,
  isStreaming
}: StreamControlProps) {
  // Guests only see controls once the stream is live.
  if (userRole === 'guest' && !isStreaming) {
    return null;
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-center sm:justify-between px-4 py-3">
        <LiveIndicator isStreaming={isStreaming} />

        <div className="flex items-center gap-2">
          <MediaToggleButton
            isActive={mediaDeviceStatus.video}
            onToggle={() => onToggleMedia("video")}
            IconOn={Video}
            IconOff={VideoOff}
            tooltip="camera"
          />
          <MediaToggleButton
            isActive={mediaDeviceStatus.audio}
            onToggle={() => onToggleMedia("audio")}
            IconOn={Mic}
            IconOff={MicOff}
            tooltip="microphone"
          />
          <div className="w-px h-6 bg-border mx-2" />
          <LeaveButton onLeaveRoom={onLeaveRoom} />
        </div>
      </div>
    </div>
  );
}