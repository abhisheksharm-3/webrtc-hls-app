'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  Video, 
  Radio, 
  Users, 
  Zap, 
  Shield, 
  Smartphone, 
  Play, 
  UserPlus,
  Eye,
  Rocket,
  Settings,
  Repeat,
  Globe
} from 'lucide-react';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    window.location.href = `/stream?room=${newRoomId}`;
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      window.location.href = `/stream?room=${roomId}`;
      setShowJoinDialog(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Video className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">WebRTC-HLS</h1>
                <p className="text-xs text-muted-foreground">Live Streaming Platform</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                How it Works
              </Link>
              <Link href="/watch" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Watch Streams
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Real-time Streaming
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Stream Live with
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                {' '}Next-Gen
              </span>
              <br />
              WebRTC & HLS
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience ultra-low latency peer-to-peer communication with unlimited scalability. 
              Start streaming instantly or broadcast to thousands with professional-grade HLS technology.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleCreateRoom}
              size="lg"
              className="gradient-primary shadow-glow text-lg px-8 h-12"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Streaming Now
            </Button>
            
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="text-lg px-8 h-12">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join with Room Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
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
                      className="col-span-3"
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
                    <Play className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href="/watch">
              <Button variant="outline" size="lg" className="text-lg px-8 h-12">
                <Eye className="w-5 h-5 mr-2" />
                Browse Live Streams
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-sm font-medium text-foreground">Ultra Low Latency</div>
              <div className="text-xs text-muted-foreground">&lt; 100ms delay</div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-medium text-foreground">Unlimited Scale</div>
              <div className="text-xs text-muted-foreground">∞ concurrent viewers</div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-medium text-foreground">Enterprise Security</div>
              <div className="text-xs text-muted-foreground">End-to-end encrypted</div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-medium text-foreground">Cross Platform</div>
              <div className="text-xs text-muted-foreground">Any device, anywhere</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Join Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Already have a room code?</h2>
                <p className="text-muted-foreground">Join an existing stream quickly with your room code</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  placeholder="Enter room code..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleJoinRoom} 
                  disabled={!roomId.trim()}
                  className="sm:px-6"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Room codes are case-sensitive and usually 9 characters long
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline">
              <Settings className="w-3 h-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-4xl font-bold text-foreground">Powerful Streaming Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for professional live streaming and broadcasting, built with modern technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">WebRTC Streaming</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Ultra-low latency peer-to-peer video and audio streaming using cutting-edge WebRTC technology
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Radio className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">HLS Broadcasting</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Automatic transcoding to HLS for unlimited concurrent viewers with global CDN support
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">Multi-participant</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Support for multiple streamers in a single room with seamless participant management
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                  <Settings className="w-6 h-6 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">Production Ready</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Built with TypeScript, comprehensive error handling, and enterprise-grade architecture
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Repeat className="w-6 h-6 text-red-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">Real-time Sync</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Instant room management and signaling using Socket.io for seamless communication
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">Easy Deployment</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Docker support with complete containerization for seamless one-click deployment
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline">
              <Play className="w-3 h-3 mr-1" />
              Process
            </Badge>
            <h2 className="text-4xl font-bold text-foreground">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with professional live streaming in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Create or Join</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create a new streaming room or join an existing one with a simple room ID. 
                No registration or complex setup required.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Start Streaming</h3>
              <p className="text-muted-foreground leading-relaxed">
                Allow camera and microphone access, then start streaming instantly with 
                ultra-low latency WebRTC technology.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full border-2 border-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Scale with HLS</h3>
              <p className="text-muted-foreground leading-relaxed">
                Enable HLS broadcasting for unlimited viewers or share the watch link 
                for public streaming events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Ready to Start Streaming?</h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of creators and businesses using our platform for professional live broadcasting
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleCreateRoom}
                size="lg"
                className="gradient-primary shadow-glow text-lg px-8 h-12"
              >
                <Video className="w-5 h-5 mr-2" />
                Create Room Now
              </Button>
              <Link href="/watch">
                <Button 
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 h-12"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Watch Live Streams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card text-card-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Video className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">WebRTC-HLS</h3>
                  <p className="text-xs text-muted-foreground">Live Streaming Platform</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Production-grade streaming platform powered by WebRTC and HLS technology for creators and enterprises.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/stream" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <Video className="w-3 h-3" />
                    Start Streaming
                  </Link>
                </li>
                <li>
                  <Link href="/watch" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    Watch Streams
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <Settings className="w-3 h-3" />
                    Features
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Technology</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  WebRTC Protocol
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  HLS Streaming
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Mediasoup SFU
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Next.js Framework
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 WebRTC-HLS Platform. Built with ❤️ using Next.js, Mediasoup, and FFmpeg.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
