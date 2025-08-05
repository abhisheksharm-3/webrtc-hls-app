import { Button } from '@/components/ui/button';
import { Video, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CTASectionProps {
  onCreateRoom: () => void;
}

export function CTASection({ onCreateRoom }: CTASectionProps) {
  return (
    <section className="py-24">
      <div className="container px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 px-8 py-16 text-center sm:px-16">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
            <div className="aspect-[1155/678] w-[36rem] bg-gradient-to-tr from-primary to-secondary opacity-10" />
          </div>
          
          <div className="relative mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Start Streaming?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Join thousands of creators and businesses using our platform for 
                professional live broadcasting and real-time communication.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button 
                onClick={onCreateRoom}
                size="lg"
                className="group h-12 px-8 text-base shadow-lg transition-all hover:shadow-xl"
              >
                <Video className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Create Room Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Link href="/watch">
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base bg-background/50 backdrop-blur"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Watch Live Streams
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">Active Streamers</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold">1M+</div>
                <div className="text-sm text-muted-foreground">Hours Streamed</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}