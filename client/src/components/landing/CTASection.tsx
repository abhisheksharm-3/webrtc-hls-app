"use client"
import { Button } from '@/components/ui/button';
import { useRoomActions } from '@/hooks/useRoomActions';
import { Video, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const stats = [
    { value: '10K+', label: 'Active Streamers' },
    { value: '1M+', label: 'Hours Streamed' },
    { value: '99.9%', label: 'Uptime' },
];

export function CTASection() {
    const {
      handleCreateRoom: onCreateRoom,
    } = useRoomActions();
  return (
    <section className="relative py-24 sm:py-32">
        {/* Adds consistency with other sections */}
        <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      ></div>
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background/80 to-background/80 backdrop-blur-xl border border-white/10 px-8 py-16 text-center sm:px-16">
          {/* Enhanced background effects */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 blur-3xl" aria-hidden="true">
            <div className="aspect-[1155/678] w-[48rem] bg-gradient-to-tr from-primary/30 to-purple-500/30 opacity-20" />
          </div>

          <div className="relative mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              {/* Applying font-serif to the main heading */}
              <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to Start Streaming?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Join thousands of creators and businesses using our platform for
                professional live broadcasting and real-time communication.
              </p>
            </div>

            {/* Updated button styles for consistency */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={onCreateRoom}
                size="lg"
                className="group h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
              >
                <Video className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                Create Room Now
                <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Link href="/watch">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105"
                >
                  <Eye className="mr-3 h-6 w-6" />
                  Watch Live Streams
                </Button>
              </Link>
            </div>

            {/* Updated stats block with font-mono and cleaner separators */}
            <div className="flex items-center justify-center gap-4 pt-8 sm:gap-8">
                {stats.map((stat, index) => (
                    <div 
                        key={stat.label} 
                        className={`flex items-center gap-4 sm:gap-8 ${index !== 0 ? 'border-l border-white/10 pl-4 sm:pl-8' : ''}`}
                    >
                        <div className="text-center">
                            <div className="font-mono text-3xl font-bold tracking-tighter sm:text-4xl">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}