"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

import { DownloadButtons } from "@/components/marketing/DownloadButtons";
import { TiltCard } from "@/components/marketing/TiltCard";
import {
  buttonTap,
  motionViewport,
  softZoom,
} from "@/lib/animations";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triad.app";

export function CTASection() {
  return (
    <section className="relative py-20" id="download">
      <div
        aria-hidden="true"
        className="gradient-blob anim-drift-blob -z-10 left-[14%] bottom-[8%] h-[22rem] w-[22rem] bg-[radial-gradient(circle,rgba(124,77,255,0.2),transparent_70%)]"
      />
      <div className="site-shell">
        <motion.div
          className="glass-panel edge-highlight relative overflow-hidden rounded-[30px] p-6 text-center sm:p-10"
          initial="hidden"
          variants={softZoom}
          viewport={motionViewport}
          whileInView="visible"
        >
          <div
            aria-hidden="true"
            className="anim-glow-pulse absolute inset-x-10 top-0 -z-10 h-48 rounded-full bg-[radial-gradient(circle,rgba(219,38,119,0.26),transparent_68%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="anim-orbit-slow absolute inset-0 -z-10"
          >
            <div className="absolute left-[14%] top-[18%] h-2 w-2 rounded-full bg-[var(--color-accent)]/70 blur-[2px]" />
            <div className="absolute right-[12%] top-[28%] h-2.5 w-2.5 rounded-full bg-[var(--color-secondary)]/70 blur-[2px]" />
            <div className="absolute left-[40%] bottom-[18%] h-2 w-2 rounded-full bg-[var(--color-cyan)]/70 blur-[2px]" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Download</p>
          <h2 className="display-font mx-auto mt-4 max-w-3xl text-[clamp(2.35rem,7vw,5rem)] font-black leading-[0.92] tracking-[-0.05em] brand-gradient-text">
            Start with the app, continue anywhere.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted-ink)]">
            Store links are configured per environment, with web access available for supported flows.
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <DownloadButtons />
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-[0.62fr_1fr]">
            <div className="grid min-h-40 place-items-center rounded-[24px] border border-dashed border-[var(--color-accent)]/40 bg-white/55 p-5">
              <span className="text-sm font-semibold text-[var(--color-muted-ink)]">QR code placeholder</span>
            </div>
            <TiltCard className="group h-full" innerClassName="rounded-[24px]" intensity={5}>
              <div className="glass-panel sheen relative h-full rounded-[24px] p-5 text-left transition-shadow duration-300 group-hover:shadow-[0_30px_60px_-22px_rgba(52,28,90,0.32)]">
                <span
                  className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.18),rgba(219,38,119,0.16))]"
                  style={{ transform: "translateZ(18px)" }}
                >
                  <Mail className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
                </span>
                <h3
                  className="mt-4 text-xl font-semibold text-[var(--color-ink)]"
                  style={{ transform: "translateZ(12px)" }}
                >
                  Contact and waitlist
                </h3>
                <p
                  className="mt-2 leading-7 text-[var(--color-muted-ink)]"
                  style={{ transform: "translateZ(8px)" }}
                >
                  Interested in launch updates, press, or partner access? Reach the Triad team directly.
                </p>
                <motion.a
                  className="focus-ring mt-5 inline-flex h-12 items-center gap-2 rounded-2xl brand-gradient-bg px-5 font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(119,86,223,0.36)]"
                  href={`mailto:${contactEmail}?subject=Triad waitlist`}
                  whileTap={buttonTap}
                >
                  Contact Triad
                  <ArrowRight className="size-4" aria-hidden="true" />
                </motion.a>
              </div>
            </TiltCard>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
