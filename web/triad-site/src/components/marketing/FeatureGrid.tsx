"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CalendarDays, Gift, HeartHandshake, Shield, WandSparkles } from "lucide-react";

import { FeatureCard } from "@/components/marketing/FeatureCard";
import { motionViewport, slideUp, staggerContainer } from "@/lib/animations";

const features = [
  {
    title: "Smart discovery",
    description: "Find people and plans around preferences, location, intention, and the kind of connection you want to make.",
    label: "Discover",
    icon: HeartHandshake,
  },
  {
    title: "Impress Me",
    description: "Move beyond a quick like with prompts that invite more thoughtful introductions and memorable replies.",
    label: "Interact",
    icon: WandSparkles,
  },
  {
    title: "Local events",
    description: "See what is happening nearby and discover connection-friendly experiences without leaving the Triad flow.",
    label: "Events",
    icon: CalendarDays,
  },
  {
    title: "Verification",
    description: "Support safer discovery with verification paths that help people understand who they are meeting.",
    label: "Trust",
    icon: BadgeCheck,
  },
  {
    title: "Privacy and safety",
    description: "Blocking, reporting, moderation, and privacy-first location handling are part of the product foundation.",
    label: "Safety",
    icon: Shield,
  },
  {
    title: "Offers and challenges",
    description: "Business partners can create events, offers, and challenges that fit how people already make plans.",
    label: "Partners",
    icon: Gift,
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20" id="features">
      <div className="site-shell">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          variants={slideUp}
          viewport={motionViewport}
          whileInView="visible"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cyan)]">Features</p>
          <h2 className="display-font mt-4 text-[clamp(2.4rem,7vw,4.8rem)] font-black leading-[0.94] tracking-normal">
            Built for richer ways to connect.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/68">
            Triad brings discovery, local activity, and trust tools into one elegant public-to-private journey.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          variants={staggerContainer}
          viewport={motionViewport}
          whileInView="visible"
        >
          {features.map((feature) => (
            <FeatureCard {...feature} key={feature.title} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
