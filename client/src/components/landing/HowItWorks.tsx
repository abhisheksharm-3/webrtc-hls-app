import { Badge } from '@/components/ui/badge';
import { steps } from '@/lib/config/landing-page-config';
import { Play } from 'lucide-react';
import { cva } from 'class-variance-authority';

// --- CVA Variant Definition for TipBox ---
const tipBoxVariants = cva("mt-4 p-3 rounded-lg border", {
  variants: {
    variant: {
      info: "bg-blue-950/50 border-blue-500/30 text-blue-300",
      host: "bg-purple-950/50 border-purple-500/30 text-purple-300",
      guest: "bg-emerald-950/50 border-emerald-500/30 text-emerald-300",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

// --- TipBox Sub-component ---

const TipBox = ({ tip }: { tip: { text: string; variant: "info" | "host" | "guest" } }) => (
  <div className={tipBoxVariants({ variant: tip.variant })}>
    <p className="text-sm font-mono">{tip.text}</p>
  </div>
);

// --- Timeline Components ---

const TimelineStep = ({ step }: { step: typeof steps[0] }) => (
  <div className="relative flex items-start gap-6 sm:gap-8">
    <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-background border-2 border-primary/50">
      <div className="flex flex-col items-center">
        <step.icon className="h-6 w-6 text-primary mb-1" />
        <span className="font-mono text-xs font-semibold text-primary">{`0${step.number}`}</span>
      </div>
    </div>
    <div className="flex-grow pt-2">
      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
      <p className="leading-relaxed text-muted-foreground">{step.description}</p>
      {step.tip && <TipBox tip={step.tip} />}
    </div>
  </div>
);

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative border-t border-border/20 bg-background/50 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      />
      <div className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
          >
            <Play className="mr-2 h-4 w-4" />
            How It Works
          </Badge>
          <h2 className="mb-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Host + Guest + Viewers
          </h2>
          <p className="mb-16 text-lg text-muted-foreground max-w-xl mx-auto">
            Perfect for podcasts, interviews, and live conversations. Two people talk, unlimited people watch.
          </p>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute left-8 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
          />
          <div className="space-y-12">
            {steps.map((step) => (
              <TimelineStep key={step.number} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}