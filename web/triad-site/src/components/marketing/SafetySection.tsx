"use client";

import { motion } from "framer-motion";
import { EyeOff, Flag, LockKeyhole, ShieldCheck, UserCheck, UserX } from "lucide-react";

import { TiltCard } from "@/components/marketing/TiltCard";
import {
  motionViewport,
  revealLeft,
  staggerRevealContainer,
  staggerRevealItem,
} from "@/lib/animations";

const safetyItems = [
  { title: "Verification", icon: UserCheck },
  { title: "Blocking", icon: UserX },
  { title: "Reporting", icon: Flag },
  { title: "Moderation", icon: ShieldCheck },
  { title: "Privacy-first location", icon: EyeOff },
  { title: "Account protections", icon: LockKeyhole },
];

export function SafetySection() {
  return (
    <section className="relative py-20" id="safety">
      <div
        aria-hidden="true"
        className="gradient-blob anim-drift-blob -z-10 right-[8%] top-[10%] h-[20rem] w-[20rem] bg-[radial-gradient(circle,rgba(124,77,255,0.18),transparent_70%)]"
      />
      <div className="site-shell grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <motion.div
          initial="hidden"
          variants={revealLeft}
          viewport={motionViewport}
          whileInView="visible"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Safety</p>
          <h2 className="display-font mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[0.94] tracking-[-0.05em] brand-gradient-text">
            Confidence is part of the experience.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--color-muted-ink)]">
            Triad is positioned around a trust-aware product foundation: verification options, reporting,
            blocking, moderation, and privacy-sensitive discovery.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial="hidden"
          variants={staggerRevealContainer}
          viewport={motionViewport}
          whileInView="visible"
        >
          {safetyItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div key={item.title} variants={staggerRevealItem}>
                <TiltCard className="group h-full" innerClassName="rounded-[24px]" intensity={5}>
                  <div className="glass-panel edge-highlight sheen relative h-full rounded-[24px] p-5 transition-shadow duration-300 group-hover:shadow-[0_30px_60px_-22px_rgba(52,28,90,0.32)]">
                    <span
                      className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.18),rgba(219,38,119,0.16))]"
                      style={{ transform: "translateZ(18px)" }}
                    >
                      <Icon className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
                    </span>
                    <h3
                      className="mt-5 text-lg font-semibold text-[var(--color-ink)]"
                      style={{ transform: "translateZ(12px)" }}
                    >
                      {item.title}
                    </h3>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
