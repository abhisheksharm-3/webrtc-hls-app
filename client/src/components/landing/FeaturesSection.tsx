import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Video,
  Radio,
  Users,
  Settings,
  Repeat,
  Rocket,
} from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'WebRTC Streaming',
    description: 'Ultra-low latency peer-to-peer video and audio streaming using cutting-edge WebRTC technology for real-time communication.',
    color: 'bg-primary/10 group-hover:bg-primary/20',
    iconColor: 'text-primary',
  },
  {
    icon: Radio,
    title: 'HLS Broadcasting',
    description: 'Automatic transcoding to HLS for unlimited concurrent viewers with global CDN support and adaptive bitrate streaming.',
    color: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: Users,
    title: 'Multi-participant',
    description: 'Support for multiple streamers in a single room with seamless participant management and role-based permissions.',
    color: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Settings,
    title: 'Production Ready',
    description: 'Built with TypeScript, comprehensive error handling, monitoring, and enterprise-grade architecture for reliability.',
    color: 'bg-orange-500/10 group-hover:bg-orange-500/20',
    iconColor: 'text-orange-500',
  },
  {
    icon: Repeat,
    title: 'Real-time Sync',
    description: 'Instant room management and signaling using Socket.io for seamless communication and state synchronization.',
    color: 'bg-red-500/10 group-hover:bg-red-500/20',
    iconColor: 'text-red-500',
  },
  {
    icon: Rocket,
    title: 'Easy Deployment',
    description: 'Docker support with complete containerization, Kubernetes manifests, and one-click deployment solutions.',
    color: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    iconColor: 'text-indigo-500',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
       {/* Subtle background glow for depth and consistency */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      ></div>

      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
          >
            <Settings className="mr-2 h-4 w-4" />
            Core Features
          </Badge>
          {/* Applying font-serif to the section heading */}
          <h2 className="mb-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Powerful Streaming Infrastructure
          </h2>
          <p className="mb-16 text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need for professional live streaming and broadcasting,
            built with modern technology and industry best practices.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              // Updated Card with glassmorphism and enhanced hover effect
              <Card 
                key={index} 
                className="group border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-white/20"
              >
                <CardHeader className="space-y-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${feature.color}`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}