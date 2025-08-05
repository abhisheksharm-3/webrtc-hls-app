import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Create or Join',
    description: 'Start a new streaming room or join an existing one with a simple room ID. No registration or complex setup required.',
  },
  {
    number: 2,
    title: 'Start Streaming',
    description: 'Allow camera and microphone access, then start streaming instantly with ultra-low latency WebRTC technology.',
  },
  {
    number: 3,
    title: 'Scale with HLS',
    description: 'Enable HLS broadcasting for unlimited viewers or share the watch link for public streaming events and conferences.',
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
      <div className="container px-4">
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
            Get Streaming in 3 Easy Steps
          </h2>
          <p className="mb-16 text-lg text-muted-foreground max-w-xl mx-auto">
            Our platform is designed for simplicity and power. Follow these steps to go live in minutes.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative mx-auto max-w-2xl">

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="relative flex items-start gap-6 sm:gap-8">
                {/* Step Number Circle */}
                <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-background border-2 border-primary/50">
                  <span className="font-mono text-lg font-semibold text-primary">{`0${step.number}`}</span>
                </div>

                {/* Step Content */}
                <div className="flex-grow pt-1.5">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}