import { Button } from '@/components/ui/button';
import { PreStreamOverlayProps } from '@/lib/types/ui-types';
import { Video, Play } from 'lucide-react';

export function PreStreamOverlay({ onStartStreaming, isReady, hasGuest }: PreStreamOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-lg p-4 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 mb-6">
            <Video className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-serif text-4xl font-bold mb-2">Ready to Go Live</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
            { !isReady ? "Connecting to room..." : hasGuest ? "Your guest has arrived. Go live together!" : "You're all set! Start your stream."}
        </p>
        <Button
            onClick={onStartStreaming}
            disabled={!isReady}
            size="lg"
            className="h-14 px-8 text-lg font-semibold group cursor-pointer transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)]"
        >
            <Play className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110" />
            {hasGuest ? "Go Live Together" : "Start Stream"}
        </Button>
    </div>
  );
}