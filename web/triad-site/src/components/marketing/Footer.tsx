"use client";

import { motion } from "framer-motion";

import { motionViewport, revealUp } from "@/lib/animations";

const webAppUrl = process.env.NEXT_PUBLIC_TRIAD_WEB_APP_URL || "#";
const businessUrl = process.env.NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL || "#business";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triad.app";

export function Footer() {
  return (
    <motion.footer
      className="relative border-t border-white/60 bg-white/40 py-10 backdrop-blur-xl"
      initial="hidden"
      variants={revealUp}
      viewport={motionViewport}
      whileInView="visible"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-[linear-gradient(90deg,transparent,rgba(124,77,255,0.5),rgba(219,38,119,0.5),transparent)]"
      />
      <div className="site-shell flex flex-col gap-6 text-sm text-[var(--color-muted-ink)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="display-font text-2xl font-black tracking-[-0.04em] brand-gradient-text">Triad</p>
          <p className="mt-2">Public marketing website for Triad.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <a className="focus-ring transition hover:text-[var(--color-ink)]" href="#features">
            Features
          </a>
          <a className="focus-ring transition hover:text-[var(--color-ink)]" href="#safety">
            Safety
          </a>
          <a className="focus-ring transition hover:text-[var(--color-ink)]" href={webAppUrl}>
            Web App
          </a>
          <a className="focus-ring transition hover:text-[var(--color-ink)]" href={businessUrl}>
            Business Portal
          </a>
          <a className="focus-ring transition hover:text-[var(--color-ink)]" href={`mailto:${contactEmail}`}>
            Contact
          </a>
        </nav>
      </div>
    </motion.footer>
  );
}
