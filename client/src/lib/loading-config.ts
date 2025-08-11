// src/app/loading-config.ts

import { HyperspeedProps } from '@/components/ui/backgrounds/Hyperspeed/Hyperspeed';
import {
  Zap,
  Video,
  Wifi,
  Globe,
  Users,
  Signal,
  Play,
} from 'lucide-react';
type HyperspeedOptions = HyperspeedProps['effectOptions'];
/**
 * Configuration for the Hyperspeed background effect.
 */
export const hyperspeedConfig: HyperspeedOptions = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 12,
  islandWidth: 3,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 1.2,
  carLightsFade: 0.5,
  totalSideLightSticks: 35,
  lightPairsPerRoadWay: 60,
  shoulderLinesWidthPercentage: 0.08,
  brokenLinesWidthPercentage: 0.12,
  brokenLinesLengthPercentage: 0.6,
  lightStickWidth: [0.15, 0.6],
  lightStickHeight: [1.5, 2.0],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -150],
  carLightsLength: [400 * 0.05, 400 * 0.25],
  carLightsRadius: [0.08, 0.18],
  carWidthPercentage: [0.35, 0.55],
  carShiftX: [-0.9, 0.9],
  carFloorSeparation: [0, 6],
  colors: {
    roadColor: 0x0a0a0a,
    islandColor: 0x171717,
    background: 0x000000,
    shoulderLines: 0x3b82f6,
    brokenLines: 0x6366f1,
    leftCars: [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0x10b981],
    rightCars: [0xf59e0b, 0xef4444, 0xec4899, 0x8b5cf6],
    sticks: 0x06b6d4,
  },
};

/**
 * Steps to be displayed during the loading sequence.
 * Duration is in milliseconds.
 */
export const loadingSteps = [
  { icon: Wifi, text: 'Establishing WebRTC connection...', duration: 1500 },
  { icon: Video, text: 'Configuring media streams...', duration: 1000 },
  { icon: Signal, text: 'Optimizing quality settings...', duration: 1200 },
  { icon: Zap, text: 'Finalizing secure channel...', duration: 800 },
];

/**
 * Fun facts to display to the user while they wait.
 */
export const funFacts = [
  'Did you know? WebRTC allows for direct browser-to-browser communication.',
  'Calibrating the flux capacitor for optimal stream velocity...',
  'Our platform can handle thousands of concurrent streams with zero lag!',
  'HLS technology enables streaming on almost any device, anywhere.',
  'Teaching the server to sing "Daisy Bell"...',
];

/**
 * Feature highlights (for potential future use, or to keep code organized).
 */
export const featureHighlights = [
  {
    Icon: Zap,
    title: 'Ultra Fast',
    subtitle: '< 100ms Latency',
    color: 'blue',
  },
  { Icon: Globe, title: 'Global CDN', subtitle: 'Worldwide', color: 'purple' },
  { Icon: Users, title: 'Multi-User', subtitle: 'Unlimited', color: 'emerald' },
  { Icon: Play, title: 'HD Quality', subtitle: '4K Ready', color: 'orange' },
];