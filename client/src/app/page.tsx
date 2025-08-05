'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { QuickJoinSection } from '@/components/landing/QuickJoinSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorks';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    window.location.href = `/stream?room=${newRoomId}`;
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      window.location.href = `/stream?room=${roomId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />
      <HeroSection 
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        roomId={roomId}
        setRoomId={setRoomId}
      />
      <QuickJoinSection 
        roomId={roomId}
        setRoomId={setRoomId}
        onJoinRoom={handleJoinRoom}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection onCreateRoom={handleCreateRoom} />
      <Footer />
    </div>
  );
}