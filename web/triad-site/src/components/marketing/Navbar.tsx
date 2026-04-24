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
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#10091d]/76 backdrop-blur-2xl"
      initial="hidden"
      variants={slideDown}
    >
      <nav aria-label="Primary" className="site-shell flex h-16 items-center justify-between">
        <a className="flex items-center gap-3" href="#home" aria-label="Triad home">
          <span className="grid size-10 place-items-center rounded-full bg-white text-[#140a24] shadow-[0_12px_32px_rgba(255,79,154,0.24)]">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="display-font text-2xl font-black tracking-normal">Triad</span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-semibold text-white/74 md:flex">
          {navItems.map((item) => (
            <a className="transition hover:text-white" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.a
            className="hidden rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#13091f] shadow-[0_18px_36px_rgba(255,255,255,0.16)] transition hover:bg-white/90 sm:inline-flex"
            href="#download"
            whileTap={buttonTap}
          >
            Download
          </motion.a>
          <button
            aria-label="Menu"
            className="grid size-10 place-items-center rounded-full border border-white/14 bg-white/8 text-white md:hidden"
            type="button"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
