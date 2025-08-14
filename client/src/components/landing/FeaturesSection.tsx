import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Feature, features } from '@/lib/config/landing-page-config';
import { Settings } from 'lucide-react';

/**
 * @description A card component to display a single feature.
 * @param {Feature} feature - The feature data object.
 */
const FeatureCard = ({ feature }: { feature: Feature }) => {
  const Icon = feature.icon;
  return (
    <Card className="group border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-white/20">
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
};

/**
 * @description The landing page section that showcases the core features of the platform.
 */
export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)]"
      ></div>

      <div className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
          >
            <Settings className="mr-2 h-4 w-4" />
            Core Features
          </Badge>
          <h2 className="mb-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Powerful Streaming Infrastructure
          </h2>
          <p className="mb-16 text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need for professional live streaming, built with modern technology and industry best practices.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* ✅ Cleaner mapping logic using the new component and a stable key */}
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};