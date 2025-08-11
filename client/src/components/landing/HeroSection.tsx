"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Rocket, UserPlus, ArrowRight } from 'lucide-react';
import Hyperspeed from '../ui/backgrounds/Hyperspeed/Hyperspeed';
import { useRoomActions } from '@/hooks/useRoomActions';
import { JoinRoomDialog } from './JoinRoomDialog';
import { heroFeatures, heroHyperspeedConfig } from '@/lib/config/landing-page-config';
import { FeatureCard } from './FeatureCard';

export function HeroSection() {
  const {
    roomId,
    setRoomId,
    handleJoinRoom,
    handleWatchRoom,
    handleCreateRoom,
  } = useRoomActions();

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed effectOptions={heroHyperspeedConfig} />
      </div>
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8 sm:py-36">
        <div className="mx-auto max-w-5xl text-center">
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
          >
            <Zap className="mr-2 h-4 w-4 text-primary" />
            Next-Gen Streaming Platform
          </Badge>

          <h1 className="mb-8 font-serif text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="text-muted-foreground/80">Stream Live with</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
              WebRTC & HLS
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Experience ultra-low latency peer-to-peer communication with unlimited scalability. Start streaming or broadcast to thousands instantly.
          </p>

          <div className="mb-24 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={handleCreateRoom}
              size="lg"
              className="group cursor-pointer h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
            >
              <Rocket className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
              Start Streaming
              <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            
            {/* ✅ Dialog logic is now beautifully encapsulated */}
            <JoinRoomDialog
              roomId={roomId}
              setRoomId={setRoomId}
              onJoinRoom={handleJoinRoom}
              onWatchRoom={handleWatchRoom}
            >
              <Button
                variant="outline"
                size="lg"
                className="h-14 cursor-pointer w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105 backdrop-blur-md"
              >
                <UserPlus className="mr-3 h-6 w-6" />
                Join with Code
              </Button>
            </JoinRoomDialog>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
            {/* ✅ Feature cards are now data-driven */}
            {heroFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}