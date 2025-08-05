import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Create or Join',
    description: 'Create a new streaming room or join an existing one with a simple room ID. No registration or complex setup required.',
    color: 'from-primary to-primary/80',
    dotColor: 'bg-emerald-500',
  },
  {
    number: 2,
    title: 'Start Streaming',
    description: 'Allow camera and microphone access, then start streaming instantly with ultra-low latency WebRTC technology.',
    color: 'from-purple-500 to-purple-600',
    dotColor: 'bg-blue-500',
  },
  {
    number: 3,
    title: 'Scale with HLS',
    description: 'Enable HLS broadcasting for unlimited viewers or share the watch link for public streaming events and conferences.',
    color: 'from-emerald-500 to-emerald-600',
    dotColor: 'bg-orange-500',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Play className="mr-2 h-3 w-3" />
            Process
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mb-16 text-lg text-muted-foreground">
            Get started with professional live streaming in just three simple steps. 
            No technical expertise required.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="group text-center">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-2xl font-bold text-white shadow-lg transition-transform group-hover:scale-105`}>
                  {step.number}
                </div>
                <div className={`absolute -right-2 -top-2 h-6 w-6 rounded-full border-2 border-background ${step.dotColor}`} />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
              <p className="leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connection Lines for Desktop */}
        <div className="relative mx-auto mt-12 hidden max-w-4xl md:block">
          <div className="absolute left-1/6 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </div>
    </section>
  );
}