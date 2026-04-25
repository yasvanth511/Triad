"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, Sparkles } from "lucide-react";
import { useState } from "react";

import { buttonTap, slideDown } from "@/lib/animations";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Businesses", href: "#business" },
  { label: "Safety", href: "#safety" },
  { label: "Download", href: "#download" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12);
  });

  return (
    <motion.header
      animate="visible"
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-white/60 backdrop-blur-2xl transition-all duration-300",
        scrolled
          ? "bg-white/85 shadow-[0_18px_42px_-22px_rgba(52,28,90,0.28)]"
          : "bg-white/70"
      )}
      initial="hidden"
      variants={slideDown}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "site-shell flex items-center justify-between transition-[height] duration-300",
          scrolled ? "h-14" : "h-16"
        )}
      >
        <a className="focus-ring flex items-center gap-3" href="#home" aria-label="Triad home">
          <span className="grid size-10 place-items-center rounded-2xl brand-gradient-bg text-white shadow-[0_12px_24px_rgba(119,86,223,0.3)]">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="display-font text-2xl font-black tracking-[-0.04em] brand-gradient-text">Triad</span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-semibold text-[var(--color-muted-ink)] md:flex">
          {navItems.map((item) => (
            <a
              className="focus-ring relative transition hover:text-[var(--color-ink)] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:brand-gradient-bg after:transition-transform after:duration-300 hover:after:scale-x-100"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.a
            className="focus-ring hidden rounded-2xl brand-gradient-bg px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.3)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(119,86,223,0.34)] sm:inline-flex"
            href="#download"
            whileTap={buttonTap}
          >
            Download
          </motion.a>
          <button
            aria-label="Menu"
            className="focus-ring grid size-10 place-items-center rounded-2xl border border-white/65 bg-white/70 text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.10)] md:hidden"
            type="button"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
