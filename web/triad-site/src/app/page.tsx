import { BusinessSection } from "@/components/marketing/BusinessSection";
import { CTASection } from "@/components/marketing/CTASection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Footer } from "@/components/marketing/Footer";
import { HeroSection } from "@/components/marketing/HeroSection";
import { Navbar } from "@/components/marketing/Navbar";
import { SafetySection } from "@/components/marketing/SafetySection";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureGrid />
        <BusinessSection />
        <SafetySection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
