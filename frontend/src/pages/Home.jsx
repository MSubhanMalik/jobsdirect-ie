import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeaturedJobs from "../components/home/FeaturedJobs";
import HowItWorks from "../components/home/HowItWorks";
import StatsSection from "../components/home/StatsSection";
import CTASection from "../components/home/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedJobs />
      <StatsSection />
      <HowItWorks />
      <CTASection />
    </>
  );
}