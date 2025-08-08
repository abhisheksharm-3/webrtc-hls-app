"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { QuickJoinSection } from "@/components/landing/QuickJoinSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/layout/Footer";
import { generateRoomId } from "@/lib/room-utils";
import { useAppStore } from "@/store/app-store";

/**
 * The main landing page component for the application.
 * It serves as the central hub for users to create a new stream,
 * join an existing stream as a guest, or watch a stream as a viewer.
 */
export default function HomePage() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  const { joinRoom } = useAppStore();

  const generateDisplayName = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 6)}`;

  /**
   * Generates a new unique room ID and navigates the user to the
   * stream page, where they will join as the default host.
   */
  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    // Set session as host before navigating
    joinRoom({ roomCode: newRoomId, userName: generateDisplayName('Host'), role: 'host' });
    // Navigates to a dynamic route like /stream/abc-123
    router.push(`/stream/${newRoomId}`);
  };

  /**
   * Navigates a user to an existing stream page using the provided room ID.
   * They will join as a guest participant.
   */
  const handleJoinRoom = () => {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId) {
      // Set session as guest before navigating
      joinRoom({ roomCode: trimmedRoomId, userName: generateDisplayName('Guest'), role: 'guest' });
      router.push(`/stream/${trimmedRoomId}`);
    }
  };

  /**
   * Navigates a user to the watch page for an existing stream.
   * They will join as a view-only participant and watch the HLS broadcast.
   */
  const handleWatchRoom = () => {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId) {
      // Set session as viewer before navigating
      joinRoom({ roomCode: trimmedRoomId, userName: generateDisplayName('Viewer'), role: 'viewer' });
      router.push(`/watch/${trimmedRoomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />
      <main>
        {/* The HeroSection contains the primary call-to-action inputs and buttons. */}
        <HeroSection
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onWatchRoom={handleWatchRoom}
          roomId={roomId}
          setRoomId={setRoomId}
        />
        {/* Other sections that compose the landing page. */}
        <QuickJoinSection
          roomId={roomId}
          setRoomId={setRoomId}
          onJoinRoom={handleJoinRoom}
          onWatchRoom={handleWatchRoom}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection onCreateRoom={handleCreateRoom} />
      </main>
      <Footer />
    </div>
  );
}