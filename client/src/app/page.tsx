'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">WebRTC-HLS</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </Link>
              <Link href="/watch" className="text-gray-600 hover:text-gray-900 transition-colors">
                Watch Streams
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Stream Live with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}WebRTC & HLS
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Real-time peer-to-peer communication with unlimited viewers. 
            Start streaming instantly or broadcast to thousands with HLS technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={handleCreateRoom}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8"
            >
              🚀 Start Streaming Now
            </Button>
            
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  👥 Join Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Join a Stream Room</DialogTitle>
                  <DialogDescription>
                    Enter the room ID to join an existing streaming session.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="room-id">Room ID</Label>
                    <Input
                      id="room-id"
                      placeholder="Enter room ID (e.g., abc123xyz)"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinRoom} disabled={!roomId.trim()}>
                    Join Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href="/watch">
              <Button variant="outline" size="lg" className="text-lg px-8">
                📺 Browse Streams
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">⚡</div>
              <div className="text-sm text-gray-600">Low Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-gray-600">Unlimited Viewers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">🔒</div>
              <div className="text-sm text-gray-600">Secure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">📱</div>
              <div className="text-sm text-gray-600">Cross Platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for professional live streaming and broadcasting
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📹</span>
                </div>
                <CardTitle>WebRTC Streaming</CardTitle>
                <CardDescription>
                  Ultra-low latency peer-to-peer video and audio streaming using modern WebRTC technology
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📡</span>
                </div>
                <CardTitle>HLS Broadcasting</CardTitle>
                <CardDescription>
                  Automatic transcoding to HLS for unlimited concurrent viewers with CDN support
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <CardTitle>Multi-participant</CardTitle>
                <CardDescription>
                  Support for multiple streamers in a single room with seamless switching
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <CardTitle>Production Ready</CardTitle>
                <CardDescription>
                  Built with TypeScript, proper error handling, and scalable architecture
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle>Real-time Sync</CardTitle>
                <CardDescription>
                  Instant room management and signaling using Socket.io for seamless communication
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <CardTitle>Easy Deployment</CardTitle>
                <CardDescription>
                  Docker support with complete containerization for one-click deployment
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to start streaming or watching live content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create or Join</h3>
              <p className="text-gray-600">
                Create a new room or join an existing one with a room ID. No registration required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Streaming</h3>
              <p className="text-gray-600">
                Allow camera/microphone access and start streaming with low-latency WebRTC technology.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Scale with HLS</h3>
              <p className="text-gray-600">
                Enable HLS for unlimited viewers or share the watch link for public broadcasting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Streaming?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of streamers using our platform for live broadcasting
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleCreateRoom}
              size="lg"
              variant="secondary"
              className="text-lg px-8"
            >
              🎥 Create Room Now
            </Button>
            <Link href="/watch">
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600"
              >
                👀 Watch Live Streams
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <h3 className="text-xl font-bold">WebRTC-HLS</h3>
              </div>
              <p className="text-gray-400">
                Production-grade streaming platform with WebRTC and HLS technology.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/stream" className="hover:text-white transition-colors">Start Streaming</Link></li>
                <li><Link href="/watch" className="hover:text-white transition-colors">Watch Streams</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>WebRTC</li>
                <li>HLS Streaming</li>
                <li>Mediasoup SFU</li>
                <li>Next.js</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Community</li>
                <li>GitHub</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 WebRTC-HLS Platform. Built with ❤️ using Next.js, Mediasoup, and FFmpeg.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
