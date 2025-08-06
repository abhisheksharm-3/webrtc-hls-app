// /components/watch/ui/StreamBrowser.tsx
import { JoinWithCodeDialog } from './JoinWithCodeDialog';
import { Card, CardContent } from '@/components/ui/card';
import { StreamMetadata } from '@/lib/types/stream-types';
import { Tv } from 'lucide-react';
import { StreamCard } from './shared/StreamCard';

interface Props {
  streams: StreamMetadata[];
  isDemo: boolean;
  onSelectStream: (stream: StreamMetadata) => void;
  onJoinWithCode: (code: string) => Promise<boolean>;
}

export const StreamBrowser = ({ streams, isDemo, onSelectStream, onJoinWithCode }: Props) => (
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <h1 className="font-serif text-5xl font-bold tracking-tight mb-4 sm:mb-0">Discover Live Streams</h1>
      <JoinWithCodeDialog onJoin={onJoinWithCode} />
    </div>

    {streams.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {streams.map(s => <StreamCard key={s.id} stream={s} isSelected={false} onSelect={onSelectStream} isDemo={isDemo} />)}
      </div>
    ) : (
      <Card className="border-white/10 bg-white/5 text-center py-20">
        <CardContent>
          <Tv className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold font-serif">No Streams Are Live</h2>
          <p className="text-muted-foreground mt-2">Check back later or refresh to see if new streams are available.</p>
        </CardContent>
      </Card>
    )}
  </div>
);