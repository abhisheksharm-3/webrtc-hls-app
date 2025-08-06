import { Separator } from '@/components/ui/separator';
import { Video, Eye, Settings, Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  platform: [
    { name: 'Start Streaming', href: '#', icon: Video },
    { name: 'Watch Streams', href: '/watch', icon: Eye },
    { name: 'Features', href: '#features', icon: Settings },
  ],
  technology: [
    { name: 'WebRTC Protocol', color: 'bg-primary' },
    { name: 'HLS Streaming', color: 'bg-purple-500' },
    { name: 'Mediasoup SFU', color: 'bg-emerald-500' },
    { name: 'Next.js Framework', color: 'bg-blue-500' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  social: [
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/20 bg-background/50 backdrop-blur-md">
      <div className="px-4 py-16 sm:py-20">
        <div className="grid gap-12 text-sm md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform duration-300 group-hover:scale-105">
                    <Video className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                    <div className="text-xl font-bold tracking-tighter">Streamify</div>
                    <p className="text-xs text-muted-foreground">Next-Gen Streaming</p>
                </div>
            </Link>
            <p className="leading-relaxed text-muted-foreground">
              Production-grade streaming platform for creators, businesses, and enterprises worldwide.
            </p>
            <div className="flex gap-2">
              {footerLinks.social.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link Columns */}
          <div className="space-y-4">
            <h4 className="font-mono uppercase tracking-wider text-muted-foreground">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono uppercase tracking-wider text-muted-foreground">Tech Stack</h4>
            <ul className="space-y-3 text-muted-foreground">
              {footerLinks.technology.map((tech) => (
                <li key={tech.name} className="flex items-center gap-2.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${tech.color}`} />
                  {tech.name}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-mono uppercase tracking-wider text-muted-foreground">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
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

        <Separator className="my-12 bg-border/10" />

        {/* Bottom Section */}
        <div className="flex flex-col-reverse items-center justify-between gap-6 md:flex-row">
          <p className="font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Streamify. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}