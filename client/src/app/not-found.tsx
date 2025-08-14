"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Hyperspeed from "@/components/ui/backgrounds/Hyperspeed/Hyperspeed";
import { ArrowRight, Compass, Home, MapPin, Search } from "lucide-react";
import {
  featureHighlights,
  hyperspeedConfig,
  quickNavLinks,
} from "@/lib/config/not-found-config";

// --- Child Components (can be moved to separate files) ---

/**
 * A reusable card for highlighting a key feature.
 */
const FeatureHighlightCard = ({
  Icon,
  title,
  subtitle,
  color,
}: {
  Icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}) => (
  <div className="group text-center">
    <div
      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border backdrop-blur-sm transition-all duration-300 group-hover:scale-105 ${color}`}
    >
      <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
    </div>
    <p className="text-base font-semibold text-foreground">{title}</p>
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {subtitle}
    </p>
  </div>
);

/**
 * A styled link for the quick navigation section.
 */
const QuickNavLink = ({ href, text }: { href: string; text: string }) => (
  <Link
    href={href}
    className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md border border-border/30 backdrop-blur-sm"
  >
    {text}
  </Link>
);

// --- Main NotFound Component ---

const NotFound = () => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
    <Header />

    {/* Background Effects */}
    <div className="absolute inset-0 z-0 opacity-20">
      <Hyperspeed effectOptions={hyperspeedConfig} />
    </div>
    <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,theme(colors.background)_80%)]" />

    {/* Content */}
    <main className="relative z-20 flex min-h-screen items-center px-4 py-28 md:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Badge
          variant="secondary"
          className="mb-8 px-4 py-2 text-sm backdrop-blur-md bg-blue-500/10 border-blue-500/20 shadow-lg text-blue-400"
        >
          <MapPin className="mr-2 h-4 w-4" />
          404 - Page Not Found
        </Badge>

        <div className="mx-auto mb-8 flex items-center justify-center">
          <div className="relative">
            <div className="font-serif text-8xl font-bold tracking-tight text-muted-foreground/20 sm:text-9xl lg:text-[12rem]">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/20 shadow-2xl">
                <Search className="h-10 w-10 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-muted-foreground/80">Lost in the</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Digital Cosmos
          </span>
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          The page you&apos;re looking for seems to have drifted away.
          Don&apos;t worry, we can guide you back to familiar territory.
        </p>

        <div className="mb-20 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button
              size="lg"
              className="group h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
            >
              <Home className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
              Return Home
              <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/watch">
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-full sm:w-auto px-8 text-lg font-semibold transition-all duration-300 ease-in-out bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105 backdrop-blur-md"
            >
              <Compass className="mr-3 h-6 w-6" />
              Explore Streams
            </Button>
          </Link>
        </div>

        {/* Data-driven Feature Cards */}
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
          {featureHighlights.map((feature) => (
            <FeatureHighlightCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Data-driven Quick Navigation */}
        <div className="mt-16 pt-8 border-t border-border/20">
          <p className="mb-6 text-sm text-muted-foreground">
            Looking for something specific? Try these destinations:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {quickNavLinks.map((link) => (
              <QuickNavLink key={link.href} {...link} />
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);

export default NotFound;
