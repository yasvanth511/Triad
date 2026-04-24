"use client";

import { motion } from "framer-motion";
import { Apple, Globe2, Play } from "lucide-react";

import { buttonTap, staggerContainer, staggerItem } from "@/lib/animations";

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
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {buttons.map((button) => {
        const Icon = button.icon;

        return (
          <motion.a
            className="group flex min-h-16 items-center gap-3 rounded-[1.25rem] border border-white/16 bg-white/10 px-5 py-3 text-left shadow-[0_18px_48px_rgba(5,3,12,0.18)] transition hover:border-white/32 hover:bg-white/14"
            href={button.href}
            key={button.label}
            variants={staggerItem}
            whileTap={buttonTap}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#140a24] transition group-hover:scale-105">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/52">
                {button.eyebrow}
              </span>
              <span className="block text-base font-semibold text-white">{button.label}</span>
            </span>
          </motion.a>
        );
      })}
    </motion.div>
  );
}
