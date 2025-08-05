import { Separator } from '@/components/ui/separator';
import { Video, Eye, Settings, Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  platform: [
    { name: 'Start Streaming', href: '/stream', icon: Video },
    { name: 'Watch Streams', href: '/watch', icon: Eye },
    { name: 'Features', href: '#features', icon: Settings },
    { name: 'API Docs', href: '/docs', icon: null },
  ],
  technology: [
    { name: 'WebRTC Protocol', color: 'bg-primary' },
    { name: 'HLS Streaming', color: 'bg-purple-500' },
    { name: 'Mediasoup SFU', color: 'bg-emerald-500' },
    { name: 'Next.js Framework', color: 'bg-blue-500' },
  ],
  support: [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/api' },
    { name: 'Community', href: '/community' },
    { name: 'GitHub', href: '#' },
  ],
  social: [
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur">
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">WebRTC-HLS</h3>
                <p className="text-xs text-muted-foreground">Live Streaming Platform</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Production-grade streaming platform powered by WebRTC and HLS technology 
              for creators, businesses, and enterprises worldwide.
            </p>
            <div className="flex gap-3">
              {footerLinks.social.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Platform Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Platform</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.platform.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          {/* Technology Stack */}
          <div className="space-y-4">
            <h4 className="font-semibold">Technology</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {footerLinks.technology.map((tech) => (
                <li key={tech.name} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${tech.color}`} />
                  {tech.name}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 WebRTC-HLS Platform. Built with ❤️ using Next.js, Mediasoup, and FFmpeg.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/support" className="transition-colors hover:text-foreground">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}