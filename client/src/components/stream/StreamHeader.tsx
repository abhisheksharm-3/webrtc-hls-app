import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Wifi, WifiOff, LogOut, Menu, X } from 'lucide-react';
import { StreamHeaderProps } from '@/lib/types/ui-types';

export function StreamHeader({ isConnected, sidebarOpen, onLeave, onToggleSidebar }: StreamHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="relative">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary shadow-lg group-hover:scale-105">
              <Video className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            {isConnected && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-emerald-500"></span>
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <div className="font-serif text-lg md:text-xl font-bold tracking-tight">Streamify</div>
            <p className="text-xs text-muted-foreground hidden md:block">Stream Dashboard</p>
          </div>
        </Link>
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className={`text-xs ${isConnected ? "bg-green-500/10 text-green-400 border-green-500/30" : ""}`}>
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            <span className="hidden sm:inline">{isConnected ? "Connected" : "Disconnected"}</span>
          </Badge>
          <Button onClick={onLeave} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-xs">
            <LogOut className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
          <Button onClick={onToggleSidebar} variant="ghost" size="sm" className="xl:hidden">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}