// src/app/loading.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Radio } from 'lucide-react';
import Hyperspeed from '@/components/ui/backgrounds/Hyperspeed/Hyperspeed';
import { funFacts, hyperspeedConfig, loadingSteps } from '@/lib/loading-config';

// --- Child Components (can be moved to separate files) ---

/**
 * Renders a single step in the loading process with dynamic status.
 */
const LoadingStep = ({
  Icon,
  text,
  status,
}: {
  Icon: React.ElementType;
  text: string;
  status: 'active' | 'completed' | 'pending';
}) => {
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-3 backdrop-blur-sm border transition-all duration-500 ${
        isActive
          ? 'bg-primary/10 border-primary/20 scale-105'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isActive || isCompleted ? 'bg-primary/20' : 'bg-white/10'
        }`}
      >
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : isActive ? (
          <Icon className="h-4 w-4 text-primary animate-spin" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <span
        className={`text-sm font-medium transition-colors ${
          isActive ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {text}
      </span>
    </div>
  );
};

/**
 * Displays a rotating fun fact.
 */
const FunFact = ({ facts }: { facts: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % facts.length);
    }, 4000); // Change fact every 4 seconds
    return () => clearInterval(timer);
  }, [facts.length]);

  return (
    <p className="text-sm text-muted-foreground animate-pulse">{facts[index]}</p>
  );
};

/**
 * The main loading page component.
 */
export default function Loading() {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = useMemo(
    () => (currentStep / loadingSteps.length) * 100,
    [currentStep]
  );

  useEffect(() => {
    if (currentStep >= loadingSteps.length) {
      // Optional: Handle what happens after loading is "done"
      // e.g., wait for Next.js to swap the page.
      // For now, it just stops.
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, loadingSteps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Hyperspeed effectOptions={hyperspeedConfig} />
      </div>
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-primary/10 border border-primary/20 shadow-lg text-primary animate-pulse"
          >
            <Radio className="mr-2 h-4 w-4 animate-pulse" />
            Initializing Stream Platform
          </Badge>

          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 backdrop-blur-sm border border-primary/20 shadow-2xl">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-muted-foreground/80">Preparing Your</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Stream Experience
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Setting up ultra-low latency connections and optimizing your
            streaming environment. This will only take a moment.
          </p>

          {/* Dynamic Loading Steps */}
          <div className="mx-auto mb-16 max-w-md space-y-3">
            {loadingSteps.map((step, index) => (
              <LoadingStep
                key={step.text}
                Icon={step.icon}
                text={step.text}
                status={
                  index < currentStep
                    ? 'completed'
                    : index === currentStep
                    ? 'active'
                    : 'pending'
                }
              />
            ))}
          </div>

          {/* Dynamic Progress Bar */}
          <div className="mx-auto mt-16 max-w-sm">
            <div className="relative">
              <div className="h-2 w-full rounded-full bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>Loading...</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Dynamic Fun Fact */}
          <div className="mt-8 h-4">
            <FunFact facts={funFacts} />
          </div>
        </div>
      </div>
    </div>
  );
}