import Link from 'next/link';
import { Video, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">WebRTC-HLS</h1>
            <p className="text-xs text-muted-foreground">Live Streaming Platform</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link 
            href="#features" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link 
            href="#how-it-works" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it Works
          </Link>
          <Link 
            href="/watch" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Watch Streams
          </Link>
          <Button size="sm" className="ml-4">
            Get Started
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Navigation */}
        <div className={cn(
          "absolute left-0 top-16 w-full border-b border-border bg-background/95 backdrop-blur md:hidden",
          mobileMenuOpen ? "block" : "hidden"
        )}>
          <nav className="container flex flex-col gap-4 px-4 py-6">
            <Link 
              href="#features" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              href="/watch" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Watch Streams
            </Link>
            <Button size="sm" className="mt-2 w-fit">
              Get Started
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}