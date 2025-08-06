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
    // Generate a more user-friendly room ID
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 3; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return segments.join('-');
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    // Redirect to stream page as host
    window.location.href = `/stream?room=${newRoomId}`;
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      // Redirect to stream page as guest
      window.location.href = `/stream?room=${roomId.trim()}`;
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