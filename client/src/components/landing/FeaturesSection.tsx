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
    iconColor: 'text-purple-600',
  },
  {
    icon: Users,
    title: 'Multi-participant',
    description: 'Support for multiple streamers in a single room with seamless participant management and role-based permissions.',
    color: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Settings,
    title: 'Production Ready',
    description: 'Built with TypeScript, comprehensive error handling, monitoring, and enterprise-grade architecture for reliability.',
    color: 'bg-orange-500/10 group-hover:bg-orange-500/20',
    iconColor: 'text-orange-600',
  },
  {
    icon: Repeat,
    title: 'Real-time Sync',
    description: 'Instant room management and signaling using Socket.io for seamless communication and state synchronization.',
    color: 'bg-red-500/10 group-hover:bg-red-500/20',
    iconColor: 'text-red-600',
  },
  {
    icon: Rocket,
    title: 'Easy Deployment',
    description: 'Docker support with complete containerization, Kubernetes manifests, and one-click deployment solutions.',
    color: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    iconColor: 'text-indigo-600',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Settings className="mr-2 h-3 w-3" />
            Features
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Powerful Streaming Features
          </h2>
          <p className="mb-16 text-lg text-muted-foreground">
            Everything you need for professional live streaming and broadcasting, 
            built with modern technology and industry best practices.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group border-0 bg-card/50 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="space-y-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${feature.color}`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
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