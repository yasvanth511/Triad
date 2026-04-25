"use client";

import { motion } from "framer-motion";
import { Menu, Sparkles } from "lucide-react";

import { buttonTap, slideDown } from "@/lib/animations";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Businesses", href: "#business" },
  { label: "Safety", href: "#safety" },
  { label: "Download", href: "#download" },
];

export function Navbar() {
  return (
    <motion.header
      animate="visible"
      className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/72 backdrop-blur-2xl"
      initial="hidden"
      variants={slideDown}
    >
      <nav aria-label="Primary" className="site-shell flex h-16 items-center justify-between">
        <a className="flex items-center gap-3" href="#home" aria-label="Triad home">
          <span className="grid size-10 place-items-center rounded-2xl brand-gradient-bg text-white shadow-[0_12px_24px_rgba(119,86,223,0.24)]">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="display-font text-2xl font-black tracking-[-0.04em] brand-gradient-text">Triad</span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-semibold text-[var(--color-muted-ink)] md:flex">
          {navItems.map((item) => (
            <a
              className="transition hover:text-[var(--color-ink)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.a
            className="hidden rounded-2xl brand-gradient-bg px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] transition hover:opacity-95 sm:inline-flex"
            href="#download"
            whileTap={buttonTap}
          >
            Download
          </motion.a>
          <button
            aria-label="Menu"
            className="grid size-10 place-items-center rounded-2xl border border-white/65 bg-white/70 text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.10)] md:hidden"
            type="button"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
