import { FeatureCardProps } from "@/components/landing/FeatureCard";
import { HyperspeedProps } from "@/components/ui/backgrounds/Hyperspeed/Hyperspeed";
import {
  Video,
  Radio,
  Users,
  Settings,
  Repeat,
  Rocket,
  Zap,
  Globe,
  Shield,
  Smartphone,
  UserPlus,
  Eye,
} from "lucide-react";

export const features = [
  {
    icon: Video,
    title: "WebRTC Streaming",
    description:
      "Ultra-low latency peer-to-peer video and audio streaming for real-time communication.",
    // This can also be converted to a variant system later if needed
    color: "bg-primary/10 group-hover:bg-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: Radio,
    title: "HLS Broadcasting",
    description:
      "Automatic transcoding to HLS for unlimited concurrent viewers with global CDN support.",
    color: "bg-purple-500/10 group-hover:bg-purple-500/20",
    iconColor: "text-purple-500",
  },
  {
    icon: Users,
    title: "Multi-participant",
    description:
      "Support for multiple streamers in a single room with seamless participant management.",
    color: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: Settings,
    title: "Production Ready",
    description:
      "Built with TypeScript, comprehensive error handling, and enterprise-grade architecture.",
    color: "bg-orange-500/10 group-hover:bg-orange-500/20",
    iconColor: "text-orange-500",
  },
  {
    icon: Repeat,
    title: "Real-time Sync",
    description:
      "Instant room management and signaling using Socket.io for state synchronization.",
    color: "bg-red-500/10 group-hover:bg-red-500/20",
    iconColor: "text-red-500",
  },
  {
    icon: Rocket,
    title: "Easy Deployment",
    description:
      "Docker support with complete containerization and one-click deployment solutions.",
    color: "bg-indigo-500/10 group-hover:bg-indigo-500/20",
    iconColor: "text-indigo-500",
  },
];

// Define a type for a single feature object for type safety
export type Feature = (typeof features)[0];

export const stats = [
  { value: "10K+", label: "Active Streamers" },
  { value: "1M+", label: "Hours Streamed" },
  { value: "99.9%", label: "Uptime" },
];

type HyperspeedOptions = HyperspeedProps["effectOptions"];

/**
 * Configuration for the Hero Section's Hyperspeed background.
 */
export const heroHyperspeedConfig: HyperspeedOptions = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 12,
  islandWidth: 3,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 1.5,
  carLightsFade: 0.6,
  totalSideLightSticks: 30,
  lightPairsPerRoadWay: 50,
  shoulderLinesWidthPercentage: 0.08,
  brokenLinesWidthPercentage: 0.12,
  brokenLinesLengthPercentage: 0.6,
  lightStickWidth: [0.15, 0.6],
  lightStickHeight: [1.5, 2.0],
  movingAwaySpeed: [70, 90],
  movingCloserSpeed: [-130, -170],
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
 * Data for the feature cards displayed in the Hero Section.
 */
export type HeroFeature = FeatureCardProps;

export const heroFeatures: HeroFeature[] = [
  {
    icon: Zap,
    title: "Low Latency",
    description: "< 100ms delay",
    color: "blue",
  },
  {
    icon: Globe,
    title: "Unlimited Scale",
    description: "∞ Viewers",
    color: "purple",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "E2E Encrypted",
    color: "emerald",
  },
  {
    icon: Smartphone,
    title: "Cross Platform",
    description: "Any Device",
    color: "orange",
  },
];

/**
 * Data for the "How It Works" section timeline.
 * ✅ The `tip` object now uses a semantic `variant` instead of `className`.
 */
export const steps: {
    number: number;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    tip?: { text: string; variant: "info" | "host" | "guest" };
}[] = [
  {
    number: 1,
    icon: Rocket,
    title: "Create a Room",
    description:
      "The host starts a new session, instantly generating a unique, shareable room code. The WebRTC connection is established, ready for a guest.",
    tip: {
      text: '💡 The host gets a room code like "abc-123-xyz"',
      variant: "info",
    },
  },
  {
    number: 2,
    icon: UserPlus,
    title: "Invite a Guest",
    description:
      "The host shares the room code with one guest, who joins the peer-to-peer session. Both can stream with ultra-low latency.",
    tip: {
      text: "💡 Only 2 people can actively stream (host + guest).",
      variant: "guest",
    },
  },
  {
    number: 3,
    icon: Eye,
    title: "Broadcast to Viewers",
    description:
      "The host enables HLS broadcasting. The server then transcodes the stream, allowing an unlimited number of viewers to watch from any device.",
    tip: {
      text: "💡 Viewers join at /watch - no video/audio needed.",
      variant: "host",
    },
  },
];

// Define a type for a single step object for type safety
export type Step = (typeof steps)[0];
