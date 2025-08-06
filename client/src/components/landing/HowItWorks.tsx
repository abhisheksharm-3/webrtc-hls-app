import { Badge } from '@/components/ui/badge';
import { Play, Users, Cast } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Host Creates Room',
    description: 'Host clicks "Start Streaming" to create a new room and gets a unique room code. They can then start their camera and begin streaming.',
    icon: Play,
  },
  {
    number: 2,
    title: 'Guest Joins with Code',
    description: 'Guest uses the room code to join as the second participant. Both host and guest can now see and hear each other via WebRTC.',
    icon: Users,
  },
  {
    number: 3,
    title: 'Viewers Watch via HLS',
    description: 'Enable HLS broadcasting for unlimited viewers. Anyone can watch the host-guest conversation on the /watch page - like a live podcast!',
    icon: Cast,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative border-t border-border/20 bg-background/50 py-24 sm:py-32">
      {/* Subtle background glow for depth and consistency */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      ></div>
      <div className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
          >
            <Play className="mr-2 h-4 w-4" />
            How It Works
          </Badge>
          {/* Applying font-serif to the section heading */}
          <h2 className="mb-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Host + Guest + Viewers
          </h2>
          <p className="mb-16 text-lg text-muted-foreground max-w-xl mx-auto">
            Perfect for podcasts, interviews, and live conversations. Two people talk, unlimited people watch.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative mx-auto max-w-3xl">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="relative flex items-start gap-6 sm:gap-8">
                {/* Step Number Circle */}
                <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-background border-2 border-primary/50">
                  <div className="flex flex-col items-center">
                    <step.icon className="h-6 w-6 text-primary mb-1" />
                    <span className="font-mono text-xs font-semibold text-primary">{`0${step.number}`}</span>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-grow pt-2">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  
                  {/* Additional context based on step */}
                  {step.number === 1 && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-mono text-blue-400">
                        💡 The host gets a room code like &ldquo;abc-123-xyz&rdquo;
                      </p>
                    </div>
                  )}
                  {step.number === 2 && (
                    <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm font-mono text-green-400">
                        💡 Only 2 people can actively stream (host + guest)
                      </p>
                    </div>
                  )}
                  {step.number === 3 && (
                    <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm font-mono text-purple-400">
                        💡 Viewers join at /watch - no video/audio needed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}