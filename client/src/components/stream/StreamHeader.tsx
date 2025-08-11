"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Wifi, LogOut, Users, Copy, CheckCircle } from 'lucide-react';
import { StreamHeaderProps } from '@/lib/types/ui-types';

// --- Child Components ---

/**
 * @description Displays the main brand logo and title in the header.
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
      <div className="font-serif text-lg md:text-xl font-bold tracking-tight">Live Podcast</div>
      <p className="text-xs text-muted-foreground hidden md:block">
        {userRole === 'host' ? 'Host Dashboard' : 'Guest View'}
      </p>
    </div>
  </Link>
);

/**
 * @description Displays the room information, including code, copy button, and participant count.
 */
const RoomInfo = ({ roomCode, participantCount }: Pick<StreamHeaderProps, 'roomCode' | 'participantCount'>) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    const textToCopy = roomCode;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard API: Oops, unable to copy', err);
      }
    } else {
      // Fallback for older browsers or restricted environments
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-1 rounded-md border bg-secondary/50 p-1 pr-2">
        <Badge variant="outline" className="font-mono border-none shadow-none">
          {roomCode}
        </Badge>
        <Button variant="ghost" size="icon" onClick={copyRoomCode} className="h-6 w-6">
          <span className="sr-only">Copy room code</span>
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
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
 * @description Displays the main action buttons for the header.
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
        className="text-xs"
      >
        <Wifi className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">HLS {isHlsEnabled ? "ON" : "OFF"}</span>
      </Button>
    )}
    <Button
      onClick={onLeaveRoom}
      variant="outline"
      size="sm"
      className="bg-white/5 border-white/10 hover:bg-white/10 text-xs"
    >
      <LogOut className="w-4 h-4 mr-1 md:mr-2" />
      <span className="hidden sm:inline">Leave</span>
    </Button>
  </div>
);


// --- Main Header Component ---

/**
 * @description The main header for the streaming interface, displaying branding,
 * room information, and primary user actions.
 */
export function StreamHeader(props: StreamHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        <BrandLogo {...props} />
        <RoomInfo {...props} />
        <HeaderActions {...props} />
      </div>
    </header>
  );
}