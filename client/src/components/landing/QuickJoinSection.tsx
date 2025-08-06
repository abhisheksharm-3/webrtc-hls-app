import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';

interface QuickJoinSectionProps {
  roomId: string;
  setRoomId: (value: string) => void;
  onJoinRoom: () => void;
}

export function QuickJoinSection({ roomId, setRoomId, onJoinRoom }: QuickJoinSectionProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onJoinRoom();
    }
  };

  return (
    <section className="relative border-y border-border/20 bg-background/50 py-24 sm:py-32">
      {/* Subtle background glow for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      ></div>

      <div className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex flex-col items-center gap-8">
            {/* Heading and Subheading */}
            <div>
              {/* Applying font-serif to the section heading */}
              <h2 className="mb-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Already have a room code?
              </h2>
              <p className="max-w-md text-lg text-muted-foreground">
                Jump right into an existing stream. Just paste your code below to get started.
              </p>
            </div>

            {/* Cohesive Input and Button Group */}
            <div className="flex w-full max-w-md items-center">
              <Input
                type="text"
                placeholder="Enter room code..."
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={handleKeyPress}
                // Applying font-mono to the input field itself
                className="h-14 flex-1 rounded-r-none border-r-0 bg-white/5 text-base transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 font-mono"
                aria-label="Room Code Input"
              />
              <Button
                onClick={onJoinRoom}
                disabled={!roomId.trim()}
                size="lg"
                className="group h-14 rounded-l-none px-6 text-base shadow-[0_0_15px_theme(colors.primary/30%)] transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_theme(colors.primary/50%)]"
                aria-label="Join Room"
              >
                Join
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Applying font-mono to the helper text */}
            <p className="font-mono text-sm text-muted-foreground">
              Room codes are case-sensitive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}