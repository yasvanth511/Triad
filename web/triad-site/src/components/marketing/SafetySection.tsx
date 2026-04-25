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
          variants={staggerContainer}
          viewport={motionViewport}
          whileInView="visible"
        >
          {safetyItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                className="premium-panel rounded-[24px] p-5"
                key={item.title}
                variants={staggerItem}
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))]">
                  <Icon className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--color-ink)]">{item.title}</h3>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
