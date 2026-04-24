"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cardHover, staggerItem } from "@/lib/animations";

export type FeatureCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  title: string;
};

export function FeatureCard({ description, icon: Icon, label, title }: FeatureCardProps) {
  return (
    <motion.article
      className="premium-panel h-full rounded-[1.5rem] p-6"
      variants={staggerItem}
      whileHover={cardHover}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#140a24]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/52">
          {label}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-7 text-white/64">{description}</p>
    </motion.article>
  );
}
