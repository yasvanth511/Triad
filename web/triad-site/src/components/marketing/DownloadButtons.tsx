"use client";

import { motion } from "framer-motion";
import { Apple, Globe2, Play } from "lucide-react";

import { buttonTap, staggerRevealContainer, staggerRevealItem } from "@/lib/animations";

const webAppUrl = process.env.NEXT_PUBLIC_TRIAD_WEB_APP_URL || "#";
const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || "#";
const googlePlayUrl = process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL || "#";

const buttons = [
  { label: "App Store", eyebrow: "Download on the", href: appStoreUrl, icon: Apple },
  { label: "Google Play", eyebrow: "Get it on", href: googlePlayUrl, icon: Play },
  { label: "Web App", eyebrow: "Open Triad", href: webAppUrl, icon: Globe2 },
];

export function DownloadButtons({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      className={compact ? "flex flex-col gap-3 sm:flex-row" : "grid gap-3 sm:grid-cols-3"}
      variants={staggerRevealContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {buttons.map((button) => {
        const Icon = button.icon;

        return (
          <motion.a
            className="focus-ring group flex min-h-16 items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-5 py-3 text-left shadow-[0_18px_42px_rgba(52,28,90,0.10)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-white/90 hover:shadow-[0_26px_52px_rgba(52,28,90,0.16)]"
            href={button.href}
            key={button.label}
            variants={staggerRevealItem}
            whileTap={buttonTap}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl brand-gradient-bg text-white shadow-[0_12px_24px_rgba(119,86,223,0.3)] transition group-hover:scale-105">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">
                {button.eyebrow}
              </span>
              <span className="block text-base font-semibold text-[var(--color-ink)]">{button.label}</span>
            </span>
          </motion.a>
        );
      })}
    </motion.div>
  );
}
