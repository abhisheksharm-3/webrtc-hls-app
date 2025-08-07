'use client';

import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Zap,
  Video,
  Radio,
  Wifi,
  Globe,
  Users,
  Signal,
  Play,
} from 'lucide-react';
import Hyperspeed from '@/components/ui/backgrounds/Hyperspeed/Hyperspeed';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-40">
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
            speedUp: 1.2,
            carLightsFade: 0.5,
            totalSideLightSticks: 35,
            lightPairsPerRoadWay: 60,
            shoulderLinesWidthPercentage: 0.08,
            brokenLinesWidthPercentage: 0.12,
            brokenLinesLengthPercentage: 0.6,
            lightStickWidth: [0.15, 0.6],
            lightStickHeight: [1.5, 2.0],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -150],
            carLightsLength: [400 * 0.05, 400 * 0.25],
            carLightsRadius: [0.08, 0.18],
            carWidthPercentage: [0.35, 0.55],
            carShiftX: [-0.9, 0.9],
            carFloorSeparation: [0, 6],
            colors: {
              roadColor: 0x0a0a0a,
              islandColor: 0x171717,
              background: 0x000000,
              shoulderLines: 0x3b82f6,
              brokenLines: 0x6366f1,
              leftCars: [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0x10b981],
              rightCars: [0xf59e0b, 0xef4444, 0xec4899, 0x8b5cf6],
              sticks: 0x06b6d4,
            },
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Loading Badge */}
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-primary/10 border border-primary/20 shadow-lg text-primary animate-pulse"
          >
            <Radio className="mr-2 h-4 w-4 animate-pulse" />
            Initializing Stream Platform
          </Badge>

          {/* Main Loading Icon */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 backdrop-blur-sm border border-primary/20 shadow-2xl">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-muted-foreground/80">Preparing Your</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Stream Experience
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Setting up ultra-low latency connections and optimizing your streaming environment. This will only take a moment.
          </p>

          {/* Loading Steps */}
          <div className="mx-auto mb-16 max-w-md space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 p-4 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Wifi className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <span className="text-sm font-medium">Establishing WebRTC connection...</span>
            </div>
            
            <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Video className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Configuring media streams...</span>
            </div>
            
            <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Signal className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Optimizing quality settings...</span>
            </div>
          </div>

          {/* Feature Cards - Similar to landing page */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 backdrop-blur-sm border border-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/30">
                <Zap className="h-7 w-7 text-blue-400 transition-transform duration-300 group-hover:scale-110 animate-pulse" />
              </div>
              <div className="text-base font-semibold text-foreground">Ultra Fast</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">&lt; 100ms Latency</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-400/5 backdrop-blur-sm border border-purple-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-purple-500/30">
                <Globe className="h-7 w-7 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Global CDN</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Worldwide</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 backdrop-blur-sm border border-emerald-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500/30">
                <Users className="h-7 w-7 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Multi-User</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Unlimited</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-400/5 backdrop-blur-sm border border-orange-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-orange-500/30">
                <Play className="h-7 w-7 text-orange-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">HD Quality</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">4K Ready</div>
            </div>
          </div>

          {/* Loading Progress Bar */}
          <div className="mx-auto mt-16 max-w-sm">
            <div className="relative">
              <div className="h-2 w-full rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 animate-pulse" style={{ width: '70%' }} />
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>Loading...</span>
                <span className="font-mono">70%</span>
              </div>
            </div>
          </div>

          {/* Fun Loading Messages */}
          <div className="mt-8">
            <p className="text-sm text-muted-foreground animate-pulse">
              Did you know? Our platform can handle thousands of concurrent streams with zero lag!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
