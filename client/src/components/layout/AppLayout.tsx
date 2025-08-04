'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Video, 
  Eye, 
  Github, 
  Twitter,
  Globe,
  Home
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export function AppLayout({ children, showNavigation = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNavigation && (
        <nav className="glass-effect border-b sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-3">
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
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Home
                  </Button>
                </Link>
                <Link href="/stream">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Stream
                  </Button>
                </Link>
                <Link href="/watch">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Watch
                  </Button>
                </Link>
                <Badge variant="outline" className="text-xs">
                  v1.0.0
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">
        {children}
      </main>

      {showNavigation && (
        <footer className="border-t bg-card text-card-foreground">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Video className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold">WebRTC-HLS</h3>
                    <p className="text-xs text-muted-foreground">Live Streaming</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Production-grade streaming platform powered by WebRTC and HLS technology.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/stream" className="text-muted-foreground hover:text-foreground transition-colors">
                      Start Streaming
                    </Link>
                  </li>
                  <li>
                    <Link href="/watch" className="text-muted-foreground hover:text-foreground transition-colors">
                      Watch Streams
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Technology</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>WebRTC Protocol</li>
                  <li>HLS Streaming</li>
                  <li>Mediasoup SFU</li>
                  <li>Next.js Framework</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Connect</h4>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://example.com" target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>&copy; 2025 WebRTC-HLS Platform. Built with ❤️ using Next.js, Mediasoup, and FFmpeg.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
