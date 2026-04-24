"use client";

import { motion } from "framer-motion";
import { EyeOff, Flag, LockKeyhole, ShieldCheck, UserCheck, UserX } from "lucide-react";

import { motionViewport, slideUp, staggerContainer, staggerItem } from "@/lib/animations";

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
    <section className="py-20" id="safety">
      <div className="site-shell grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <motion.div
          initial="hidden"
          variants={slideUp}
          viewport={motionViewport}
          whileInView="visible"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cyan)]">Safety</p>
          <h2 className="display-font mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[0.94] tracking-normal">
            Confidence is part of the experience.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/68">
            Triad is positioned around a trust-aware product foundation: verification options, reporting,
            blocking, moderation, and privacy-sensitive discovery.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial="hidden"
          variants={staggerContainer}
          viewport={motionViewport}
          whileInView="visible"
        >
          {safetyItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                className="rounded-[1.35rem] border border-white/12 bg-white/8 p-5"
                key={item.title}
                variants={staggerItem}
              >
                <Icon className="size-6 text-[var(--color-cyan)]" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
