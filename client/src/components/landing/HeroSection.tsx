import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Zap,
  Rocket,
  UserPlus,
  Eye,
  Play,
  Globe,
  Shield,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Hyperspeed from '../ui/backgrounds/Hyperspeed/Hyperspeed';

interface HeroSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  roomId: string;
  setRoomId: (value: string) => void;
}

export function HeroSection({ onCreateRoom, onJoinRoom, roomId, setRoomId }: HeroSectionProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const handleJoinRoom = () => {
    onJoinRoom();
    setShowJoinDialog(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects - Fixed positioning and improved colors */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => { },
            onSlowDown: () => { },
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 12,
            islandWidth: 3,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 1.5,
            carLightsFade: 0.6,
            totalSideLightSticks: 30,
            lightPairsPerRoadWay: 50,
            shoulderLinesWidthPercentage: 0.08,
            brokenLinesWidthPercentage: 0.12,
            brokenLinesLengthPercentage: 0.6,
            lightStickWidth: [0.15, 0.6],
            lightStickHeight: [1.5, 2.0],
            movingAwaySpeed: [70, 90],
            movingCloserSpeed: [-130, -170],
            carLightsLength: [400 * 0.05, 400 * 0.25],
            carLightsRadius: [0.08, 0.18],
            carWidthPercentage: [0.35, 0.55],
            carShiftX: [-0.9, 0.9],
            carFloorSeparation: [0, 6],
            colors: {
              // Using CSS custom properties for theme integration
              roadColor: 0x0a0a0a,        // Darker road for contrast
              islandColor: 0x171717,      // Slightly lighter for separation
              background: 0x000000,       // Pure black background
              shoulderLines: 0x3b82f6,    // Blue accent (matches primary)
              brokenLines: 0x6366f1,      // Indigo variant
              leftCars: [
                0x3b82f6,  // Blue
                0x8b5cf6,  // Purple
                0x06b6d4,  // Cyan
                0x10b981   // Emerald
              ],
              rightCars: [
                0xf59e0b,  // Amber
                0xef4444,  // Red
                0xec4899,  // Pink
                0x8b5cf6   // Purple
              ],
              sticks: 0x06b6d4,          // Cyan for side lights
            }
          }}
        />
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />

      {/* Content */}
      <div className="container relative z-20 flex min-h-screen items-center px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 backdrop-blur-sm bg-background/80 border border-border/50">
            <Zap className="mr-2 h-3 w-3" />
            Real-time Streaming Technology
          </Badge>

          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-lg">
            Stream Live with{' '}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Next-Gen
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent">
              WebRTC & HLS
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl backdrop-blur-sm">
            Experience ultra-low latency peer-to-peer communication with unlimited scalability. 
            Start streaming instantly or broadcast to thousands with professional-grade technology.
          </p>

          {/* CTA Buttons */}
          <div className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button 
              onClick={onCreateRoom}
              size="lg"
              className="group h-12 px-8 text-base shadow-2xl backdrop-blur-sm bg-primary/90 hover:bg-primary transition-all hover:shadow-xl hover:scale-105"
            >
              <Rocket className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Start Streaming Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-12 px-8 text-base backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/80 hover:scale-105 transition-all"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Join with Room Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] backdrop-blur-sm bg-background/95 border-border/50">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Join a Stream Room
                  </DialogTitle>
                  <DialogDescription>
                    Enter the room ID to join an existing streaming session. You can get this from the room creator.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="room-id">Room Code</Label>
                    <Input
                      id="room-id"
                      placeholder="Enter room code (e.g., abc123xyz)"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-background/50 border-border/50 backdrop-blur-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Room codes are typically 9 characters long and case-sensitive
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinRoom} disabled={!roomId.trim()}>
                    <Play className="mr-2 h-4 w-4" />
                    Join Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href="/watch">
              <Button 
                variant="ghost" 
                size="lg" 
                className="h-12 px-8 text-base backdrop-blur-sm hover:bg-background/20 hover:scale-105 transition-all"
              >
                <Eye className="mr-2 h-5 w-5" />
                Browse Live Streams
              </Button>
            </Link>
          </div>

          {/* Stats Grid - Enhanced with glassmorphism */}
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
            <div className="group text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-sm border border-blue-500/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                <Zap className="h-7 w-7 text-blue-400" />
              </div>
              <div className="text-sm font-semibold text-foreground">Ultra Low Latency</div>
              <div className="text-xs text-muted-foreground">&lt; 100ms delay</div>
            </div>
            <div className="group text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-sm border border-purple-500/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/25">
                <Globe className="h-7 w-7 text-purple-400" />
              </div>
              <div className="text-sm font-semibold text-foreground">Unlimited Scale</div>
              <div className="text-xs text-muted-foreground">∞ concurrent viewers</div>
            </div>
            <div className="group text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 backdrop-blur-sm border border-emerald-500/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/25">
                <Shield className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-foreground">Enterprise Security</div>
              <div className="text-xs text-muted-foreground">End-to-end encrypted</div>
            </div>
            <div className="group text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-sm border border-orange-500/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/25">
                <Smartphone className="h-7 w-7 text-orange-400" />
              </div>
              <div className="text-sm font-semibold text-foreground">Cross Platform</div>
              <div className="text-xs text-muted-foreground">Any device, anywhere</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}