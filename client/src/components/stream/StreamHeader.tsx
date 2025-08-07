import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Wifi, LogOut, Users, Radio, Copy, CheckCircle } from 'lucide-react';
import { StreamHeaderProps } from '@/lib/types/ui-types';
import { useState } from 'react';

export function StreamHeader({ 
  roomCode, 
  userRole, 
  participantCount, 
  isStreaming, 
  onLeaveRoom, 
  onToggleHLS, 
  isHlsEnabled 
}: StreamHeaderProps) {
  const [copied, setCopied] = useState(false);
  
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="relative">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary shadow-lg group-hover:scale-105">
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

        {/* Room Info */}
        <div className="flex items-center gap-3">
          {/* Room Code */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Room: {roomCode}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomCode}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Participant Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participantCount}</span>
          </div>

          {/* Stream Status */}
          <Badge variant={isStreaming ? "default" : "secondary"} className={isStreaming ? "bg-red-500/10 text-red-400 border-red-500/30" : ""}>
            <Radio className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{isStreaming ? "LIVE" : "OFFLINE"}</span>
          </Badge>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* HLS Toggle - Only for host */}
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
      </div>
    </header>
  );
}