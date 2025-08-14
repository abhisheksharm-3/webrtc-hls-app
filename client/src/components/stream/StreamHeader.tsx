"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Wifi, LogOut, Users, Copy, CheckCircle } from 'lucide-react';
import { StreamHeaderProps } from '@/lib/types/ui-types';
import { cn } from '@/lib/utils';

// --- Style Constants for Readability ---
const hlsButtonStyles = "text-xs transition-all cursor-pointer";
const leaveButtonStyles = "bg-white/5 border-white/10 hover:bg-white/10 text-xs cursor-pointer";

// --- Child Components ---

/**
 * Displays the main brand logo and stream title.
 */
const BrandLogo = ({ isStreaming, userRole }: Pick<StreamHeaderProps, 'isStreaming' | 'userRole'>) => (
  <Link href="/" className="flex items-center gap-2 md:gap-3 group">
    <div className="relative">
      <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary shadow-lg transition-transform duration-300 group-hover:scale-105">
        <Video className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
      </div>
      {isStreaming && (
        <div className="absolute -right-1 -top-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-red-500"></span>
        </div>
      )}
    </div>
    <div className="hidden sm:block">
      <div className="font-serif text-lg md:text-xl font-bold tracking-tight">Live Stream</div>
      <p className="text-xs text-muted-foreground hidden md:block">
        {userRole === 'host' ? 'Host Controls' : 'Guest Mode'}
      </p>
    </div>
  </Link>
);

/**
 * Displays the room code, copy button, and participant count.
 */
const RoomInfo = ({ roomCode, participantCount }: Pick<StreamHeaderProps, 'roomCode' | 'participantCount'>) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy room code: ', err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
      document.body.removeChild(textArea);
    });
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-2 rounded-lg border bg-background/70 p-1.5 backdrop-blur-sm">
        <Badge variant="secondary" className="font-mono text-xs tracking-wider border-none shadow-none bg-transparent">
          {roomCode}
        </Badge>
        <Button variant="ghost" size="icon" onClick={copyRoomCode} className="h-7 w-7 rounded-md">
          <span className="sr-only">Copy room code</span>
          <div className="relative h-4 w-4">
            <CheckCircle className={cn("absolute transition-all duration-300 text-green-500", copied ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
            <Copy className={cn("absolute transition-all duration-300", copied ? "scale-0 opacity-0" : "scale-100 opacity-100")} />
          </div>
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{participantCount}</span>
      </div>
    </div>
  );
};

/**
 * Displays the main action buttons (HLS toggle, Leave).
 */
const HeaderActions = ({
  userRole,
  isStreaming,
  isHlsEnabled,
  onToggleHLS,
  onLeaveRoom
}: Omit<StreamHeaderProps, 'roomCode' | 'participantCount'>) => (
  <div className="flex items-center gap-2">
    {userRole === 'host' && isStreaming && (
      <Button
        onClick={onToggleHLS}
        variant={isHlsEnabled ? "default" : "outline"}
        size="sm"
        className={cn(hlsButtonStyles, isHlsEnabled && "shadow-md shadow-primary/30")}
      >
        <Wifi className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">HLS {isHlsEnabled ? "ON" : "OFF"}</span>
      </Button>
    )}
    <Button onClick={onLeaveRoom} variant="outline" size="sm" className={leaveButtonStyles}>
      <LogOut className="w-4 h-4 mr-1 md:mr-2" />
      <span className="hidden sm:inline">Leave</span>
    </Button>
  </div>
);

// --- Main Header Component ---

export function StreamHeader({
  roomCode,
  userRole,
  participantCount,
  isStreaming,
  isHlsEnabled,
  onLeaveRoom,
  onToggleHLS,
}: StreamHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        <BrandLogo isStreaming={isStreaming} userRole={userRole} />
        <RoomInfo roomCode={roomCode} participantCount={participantCount} />
        <HeaderActions
          userRole={userRole}
          isStreaming={isStreaming}
          isHlsEnabled={isHlsEnabled}
          onToggleHLS={onToggleHLS}
          onLeaveRoom={onLeaveRoom}
        />
      </div>
    </header>
  );
}
