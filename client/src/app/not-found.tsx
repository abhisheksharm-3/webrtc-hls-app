'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Home,
  ArrowRight,
  MapPin,
  Compass,
  Video,
  Users,
  Globe,
  Rocket,
} from 'lucide-react';
import Hyperspeed from '@/components/ui/backgrounds/Hyperspeed/Hyperspeed';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-20">
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
            speedUp: 0.6,
            carLightsFade: 0.3,
            totalSideLightSticks: 25,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.08,
            brokenLinesWidthPercentage: 0.12,
            brokenLinesLengthPercentage: 0.6,
            lightStickWidth: [0.15, 0.6],
            lightStickHeight: [1.5, 2.0],
            movingAwaySpeed: [40, 60],
            movingCloserSpeed: [-80, -110],
            carLightsLength: [400 * 0.05, 400 * 0.25],
            carLightsRadius: [0.08, 0.18],
            carWidthPercentage: [0.35, 0.55],
            carShiftX: [-0.9, 0.9],
            carFloorSeparation: [0, 6],
            colors: {
              roadColor: 0x0a0a0a,
              islandColor: 0x171717,
              background: 0x000000,
              shoulderLines: 0x6366f1,
              brokenLines: 0x8b5cf6,
              leftCars: [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0x10b981],
              rightCars: [0xf59e0b, 0xef4444, 0xec4899, 0x8b5cf6],
              sticks: 0x6366f1,
            },
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* 404 Badge */}
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-blue-500/10 border border-blue-500/20 shadow-lg text-blue-400"
          >
            <MapPin className="mr-2 h-4 w-4" />
            404 - Page Not Found
          </Badge>

          {/* Large 404 Display */}
          <div className="mx-auto mb-8 flex items-center justify-center">
            <div className="relative">
              <div className="font-serif text-8xl font-bold tracking-tight text-muted-foreground/20 sm:text-9xl lg:text-[12rem]">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/20 shadow-2xl">
                  <Search className="h-10 w-10 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-muted-foreground/80">Lost in the</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Digital Space
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            The page you&apos;re looking for seems to have drifted away in cyberspace. Don&apos;t worry though – there are plenty of exciting streams and features waiting for you.
          </p>

          {/* Action Buttons */}
          <div className="mb-20 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="group h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
              >
                <Home className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                Return Home
                <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href="/watch">
              <Button
                variant="outline"
                size="lg"
                className="h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105 backdrop-blur-md"
              >
                <Compass className="mr-3 h-6 w-6" />
                Explore Streams
              </Button>
            </Link>
          </div>

          {/* Feature Cards - Similar to landing page */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 backdrop-blur-sm border border-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/30">
                <Video className="h-7 w-7 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Live Streams</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Always On</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-400/5 backdrop-blur-sm border border-purple-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-purple-500/30">
                <Users className="h-7 w-7 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Communities</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Join Others</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 backdrop-blur-sm border border-emerald-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500/30">
                <Globe className="h-7 w-7 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Global Reach</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Worldwide</div>
            </div>

            <div className="group text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-400/5 backdrop-blur-sm border border-orange-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-orange-500/30">
                <Rocket className="h-7 w-7 text-orange-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-base font-semibold text-foreground">Quick Start</div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Instant Setup</div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mt-16 pt-8 border-t border-border/20">
            <p className="mb-6 text-sm text-muted-foreground">
              Looking for something specific? Try these popular destinations:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md border border-border/30 backdrop-blur-sm"
              >
                Home
              </Link>
              <Link
                href="/watch"
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md border border-border/30 backdrop-blur-sm"
              >
                Watch Streams
              </Link>
              <Link
                href="/#features"
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md border border-border/30 backdrop-blur-sm"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md border border-border/30 backdrop-blur-sm"
              >
                How it Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
