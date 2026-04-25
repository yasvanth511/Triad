"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { TiltCard } from "@/components/marketing/TiltCard";
import { staggerRevealItem } from "@/lib/animations";

export type FeatureCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  title: string;
};

export function FeatureCard({ description, icon: Icon, label, title }: FeatureCardProps) {
  return (
    <motion.div className="h-full" variants={staggerRevealItem}>
      <TiltCard className="group h-full" innerClassName="rounded-[28px]" intensity={6}>
        <article className="glass-panel edge-highlight sheen relative flex h-full flex-col rounded-[28px] p-6 transition-shadow duration-300 group-hover:shadow-[0_36px_72px_-24px_rgba(52,28,90,0.36)]">
          <div
            className="mb-6 flex items-center justify-between gap-4"
            style={{ transform: "translateZ(20px)" }}
          >
            <span className="grid size-12 place-items-center rounded-2xl brand-gradient-bg text-white shadow-[0_12px_24px_rgba(119,86,223,0.3)] transition-transform duration-300 group-hover:scale-105">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-ink)] backdrop-blur">
              {label}
            </span>
          </div>
          <h3
            className="text-xl font-semibold text-[var(--color-ink)]"
            style={{ transform: "translateZ(14px)" }}
          >
            {title}
          </h3>
          <p
            className="mt-3 leading-7 text-[var(--color-muted-ink)]"
            style={{ transform: "translateZ(8px)" }}
          >
            {description}
          </p>
        </article>
      </TiltCard>
    </motion.div>
  );
}
