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

/**
 * The main landing page of the application.
 * It handles the primary user actions like creating, joining, or watching a room.
 */
export default function HomePage() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  /**
   * Creates a new room and navigates to the stream page as a host.
   */
  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    router.push(`/stream/${newRoomId}`);
  };

  /**
   * Navigates to an existing room as a guest participant.
   * Validates that the roomId is not empty before navigating.
   */
  const handleJoinRoom = () => {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId) {
      router.push(`/stream/${trimmedRoomId}`);
    }
  };

  /**
   * Navigates to an existing room as a viewer.
   * Validates that the roomId is not empty before navigating.
   */
  const handleWatchRoom = () => {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId) {
      router.push(`/watch/${trimmedRoomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />
      <main>
        <HeroSection
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onWatchRoom={handleWatchRoom}
          roomId={roomId}
          setRoomId={setRoomId}
        />
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
