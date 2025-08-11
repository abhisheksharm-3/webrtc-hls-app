import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { QuickJoinSection } from "@/components/landing/QuickJoinSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";

/**
 * The main landing page component for the application.
 * It serves as the central hub for users to create, join, or watch a stream.
 */
export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />
      <main>
        <HeroSection />
        <QuickJoinSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
