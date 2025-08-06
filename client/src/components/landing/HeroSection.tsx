import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Play,
  Globe,
  Shield,
  Smartphone,
  ArrowRight,
  Users,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import Hyperspeed from '../ui/backgrounds/Hyperspeed/Hyperspeed';

interface HeroSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onWatchRoom?: () => void;
  roomId: string;
  setRoomId: (value: string) => void;
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass: string;
}

const FeatureCard = ({ icon, title, description, colorClass }: FeatureCardProps) => {
  const IconComponent = icon;
  return (
    <div className="group text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-white/20 group-hover:shadow-2xl ${colorClass}`}
      >
        <IconComponent className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      {/* Using font-mono for the technical description */}
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{description}</div>
    </div>
  );
};


export function HeroSection({ onCreateRoom, onJoinRoom, onWatchRoom, roomId, setRoomId }: HeroSectionProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinMode, setJoinMode] = useState<'participate' | 'watch'>('participate');

  const handleJoinRoom = () => {
    if (joinMode === 'participate') {
      onJoinRoom();
    } else {
      onWatchRoom?.();
    }
    setShowJoinDialog(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed
          effectOptions={{
            // Your Hyperspeed options remain the same
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

      {/* Improved Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8 sm:py-36">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
          >
            <Zap className="mr-2 h-4 w-4 text-primary" />
            Next-Gen Streaming Platform
          </Badge>

          {/* Main Heading with Serif Font */}
          <h1 className="mb-8 font-serif text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="text-muted-foreground/80">Stream Live with</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
              WebRTC & HLS
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Experience ultra-low latency peer-to-peer communication with unlimited scalability. Start streaming or broadcast to thousands instantly.
          </p>

          {/* CTA Buttons */}
          <div className="mb-24 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={onCreateRoom}
              size="lg"
              className="group cursor-pointer h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
            >
              <Rocket className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
              Start Streaming
              <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 cursor-pointer w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105 backdrop-blur-md"
                >
                  <UserPlus className="mr-3 h-6 w-6" />
                  Join with Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-background/80 border-border/30 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Join a Stream Room
                  </DialogTitle>
                  <DialogDescription>
                    Enter the room ID and choose how you want to join the session.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="room-id" className="font-mono text-sm">Room Code</Label>
                    <Input
                      id="room-id"
                      placeholder="e.g., abc-123-xyz"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-12 bg-background/50 border-border/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0"
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label className="font-mono text-sm">Join Mode</Label>
                    <RadioGroup value={joinMode} onValueChange={(value: string) => setJoinMode(value as 'participate' | 'watch')} className="grid gap-3">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
                        <RadioGroupItem value="participate" id="participate" />
                        <Label htmlFor="participate" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Join as Guest</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Participate in the conversation with video and audio</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
                        <RadioGroupItem value="watch" id="watch" />
                        <Label htmlFor="watch" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Watch Only</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Watch the stream without participating</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinRoom} disabled={!roomId.trim()}>
                    <Play className="mr-2 h-4 w-4" />
                    Join Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Modernized Bento Grid */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
            <FeatureCard
              icon={Zap}
              title="Low Latency"
              description="< 100ms delay"
              colorClass="text-blue-400 shadow-blue-500/20"
            />
            <FeatureCard
              icon={Globe}
              title="Unlimited Scale"
              description="∞ Viewers"
              colorClass="text-purple-400 shadow-purple-500/20"
            />
            <FeatureCard
              icon={Shield}
              title="Secure"
              description="E2E Encrypted"
              colorClass="text-emerald-400 shadow-emerald-500/20"
            />
            <FeatureCard
              icon={Smartphone}
              title="Cross Platform"
              description="Any Device"
              colorClass="text-orange-400 shadow-orange-500/20"
            />
          </div>
        </div>
      </div>
    </section>
  );
}