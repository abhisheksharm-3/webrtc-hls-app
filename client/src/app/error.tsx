'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowRight,
  Zap,
  Video,
  Shield,
  Bug,
} from 'lucide-react';
import Hyperspeed from '@/components/ui/backgrounds/Hyperspeed/Hyperspeed';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Add a small delay for better UX
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 1000);
  };

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => {},
            onSlowDown: () => {},
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 12,
            islandWidth: 3,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 0.8,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 30,
            shoulderLinesWidthPercentage: 0.08,
            brokenLinesWidthPercentage: 0.12,
            brokenLinesLengthPercentage: 0.6,
            lightStickWidth: [0.15, 0.6],
            lightStickHeight: [1.5, 2.0],
            movingAwaySpeed: [50, 70],
            movingCloserSpeed: [-100, -130],
            carLightsLength: [400 * 0.05, 400 * 0.25],
            carLightsRadius: [0.08, 0.18],
            carWidthPercentage: [0.35, 0.55],
            carShiftX: [-0.9, 0.9],
            carFloorSeparation: [0, 6],
            colors: {
              roadColor: 0x0a0a0a,
              islandColor: 0x171717,
              background: 0x000000,
              shoulderLines: 0xef4444,
              brokenLines: 0xf97316,
              leftCars: [0xef4444, 0xf97316, 0xeab308, 0xdc2626],
              rightCars: [0xf97316, 0xef4444, 0xeab308, 0xdc2626],
              sticks: 0xef4444,
            },
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Error Badge */}
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-red-500/10 border border-red-500/20 shadow-lg text-red-400"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            System Error Detected
          </Badge>

          {/* Main Error Icon */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-500/20 shadow-2xl">
            <Bug className="h-12 w-12 text-red-400" />
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-muted-foreground/80">Oops! Something</span>
            <br />
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Went Wrong
            </span>
          </h1>

          {/* Error Description */}
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            We encountered an unexpected error while processing your request. Our team has been notified and is working to fix this issue.
          </p>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mx-auto mb-12 max-w-2xl rounded-lg bg-red-500/5 border border-red-500/20 p-4 text-left backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="h-4 w-4 text-red-400" />
                <span className="font-mono text-sm font-semibold text-red-400">Error Details</span>
              </div>
              <code className="block text-xs text-red-300 break-all">
                {error.message}
              </code>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Error ID: <span className="font-mono">{error.digest}</span>
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              size="lg"
              className="group h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-3 h-6 w-6 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-180" />
                  Try Again
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105 backdrop-blur-md"
              >
                <Home className="mr-3 h-6 w-6" />
                Go Home
              </Button>
            </Link>
          </div>

          {/* Feature Cards - Similar to landing page */}
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 backdrop-blur-sm border border-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/30">
                <Video className="h-7 w-7 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Still Streaming</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Platform Active</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 backdrop-blur-sm border border-emerald-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500/30">
                <Shield className="h-7 w-7 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Secure</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Data Protected</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-400/5 backdrop-blur-sm border border-purple-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-purple-500/30">
                <Zap className="h-7 w-7 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Auto Recovery</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Self Healing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
