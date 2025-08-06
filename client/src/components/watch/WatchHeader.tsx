// /components/watch/ui/WatchHeader.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Video, RefreshCw } from 'lucide-react';

export const WatchHeader = ({ onRefresh }: { onRefresh: () => void }) => (
  <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl">
    <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg group-hover:scale-105">
          <Video className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <div className="font-serif text-2xl font-bold tracking-tight">Streamify</div>
          <p className="text-xs text-muted-foreground">Watch Live</p>
        </div>
      </Link>
      <Button onClick={onRefresh} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
        <RefreshCw className="w-4 h-4 mr-2" />Refresh
      </Button>
    </div>
  </header>
);