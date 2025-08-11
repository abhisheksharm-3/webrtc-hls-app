// src/lib/not-found-config.ts

import {
  Video,
  Users,
  Globe,
  Rocket,
} from 'lucide-react';
import type { HyperspeedProps } from '@/components/ui/backgrounds/Hyperspeed/Hyperspeed';

type HyperspeedOptions = HyperspeedProps['effectOptions'];

/**
 * Configuration for the Hyperspeed background effect.
 */
export const hyperspeedConfig: HyperspeedOptions = {
  // This config is slightly different for a more ambient feel
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 12,
  islandWidth: 3,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 0.6,
  carLightsFade: 0.3,
  totalSideLightSticks: 25,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.08,
  brokenLinesWidthPercentage: 0.12,
  brokenLinesLengthPercentage: 0.6,
  lightStickWidth: [0.15, 0.6],
  lightStickHeight: [1.5, 2.0],
  movingAwaySpeed: [40, 60],
  movingCloserSpeed: [-80, -110],
  carLightsLength: [400 * 0.05, 400 * 0.25],
  carLightsRadius: [0.08, 0.18],
  carWidthPercentage: [0.35, 0.55],
  carShiftX: [-0.9, 0.9],
  carFloorSeparation: [0, 6],
  colors: {
    roadColor: 0x0a0a0a,
    islandColor: 0x171717,
    background: 0x000000,
    shoulderLines: 0x6366f1,
    brokenLines: 0x8b5cf6,
    leftCars: [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0x10b981],
    rightCars: [0xf59e0b, 0xef4444, 0xec4899, 0x8b5cf6],
    sticks: 0x6366f1,
  },
};

/**
 * Data for the feature highlight cards.
 */
export const featureHighlights = [
  {
    Icon: Video,
    title: 'Live Streams',
    subtitle: 'Always On',
    color: 'bg-gradient-to-br from-blue-500/10 to-blue-400/5 text-blue-400 border-blue-500/20 group-hover:border-blue-500/30'
  },
  {
    Icon: Users,
    title: 'Communities',
    subtitle: 'Join Others',
    color: 'bg-gradient-to-br from-purple-500/10 to-purple-400/5 text-purple-400 border-purple-500/20 group-hover:border-purple-500/30'
  },
  {
    Icon: Globe,
    title: 'Global Reach',
    subtitle: 'Worldwide',
    color: 'bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/30'
  },
  {
    Icon: Rocket,
    title: 'Quick Start',
    subtitle: 'Instant Setup',
    color: 'bg-gradient-to-br from-orange-500/10 to-orange-400/5 text-orange-400 border-orange-500/20 group-hover:border-orange-500/30'
  }
];

/**
 * Data for the quick navigation links.
 */
export const quickNavLinks = [
  { href: '/', text: 'Home' },
  { href: '/watch', text: 'Watch Streams' },
  { href: '/#features', text: 'Features' },
  { href: '/#how-it-works', text: 'How It Works' },
];