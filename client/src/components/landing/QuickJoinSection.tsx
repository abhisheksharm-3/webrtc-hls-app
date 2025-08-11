"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoomActions } from '@/hooks/useRoomActions';
import { ArrowRight } from 'lucide-react';

/**
 * @description A section on the landing page for users to quickly join or watch a stream using a room code.
 */
export function QuickJoinSection() {
  const {
    roomId,
    setRoomId,
    handleJoinRoom,
    handleWatchRoom,
  } = useRoomActions();

  /**
   * @description Handles the primary form submission to join a room as a guest.
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents the default browser page reload
    if (!roomId.trim()) return;
    handleJoinRoom();
  };

  /**
   * @description Handles the secondary action to watch a stream.
   */
  const handleWatchClick = () => {
    if (!roomId.trim()) return;
    handleWatchRoom();
  };

  return (
    <section className="relative border-y border-border/20 bg-background/50 py-24 sm:py-32">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      />

      <div className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex flex-col items-center gap-8">
            <div>
              <h2 className="mb-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Already have a room code?
              </h2>
              <p className="max-w-md text-lg text-muted-foreground">
                Jump right into an existing stream. Just paste your code below to get started.
              </p>
            </div>

            {/* ✅ Converted to a semantic form for better accessibility and native behavior */}
            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4 items-center">
              <div className="flex w-full items-center">
                <Input
                  type="text"
                  placeholder="Enter room code..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="h-14 flex-1 rounded-r-none border-r-0 bg-white/5 text-base transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 font-mono"
                  aria-label="Room Code Input"
                />
                <Button
                  type="submit"
                  disabled={!roomId.trim()}
                  size="lg"
                  className="group h-14 rounded-l-none px-6 text-base shadow-[0_0_15px_theme(colors.primary/30%)] transition-all duration-300 ease-in-out hover:shadow-[0_0_30px_theme(colors.primary/50%)]"
                  aria-label="Join Room as Guest"
                >
                  Join
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">or</span>
                <Button
                  type="button" // Prevents form submission
                  onClick={handleWatchClick}
                  disabled={!roomId.trim()}
                  variant="link"
                  className="text-sm text-muted-foreground hover:text-primary"
                  aria-label="Watch Stream Only"
                >
                  Watch Only
                </Button>
              </div>
            </form>

            <p className="font-mono text-sm text-muted-foreground">
              Room codes are case-sensitive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}