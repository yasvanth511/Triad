"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

import { DownloadButtons } from "@/components/marketing/DownloadButtons";
import { buttonTap, motionViewport, scaleIn } from "@/lib/animations";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triad.app";

export function CTASection() {
  return (
    <section className="py-20" id="download">
      <div className="site-shell">
        <motion.div
          className="premium-panel relative overflow-hidden rounded-[30px] p-6 text-center sm:p-10"
          initial="hidden"
          variants={scaleIn}
          viewport={motionViewport}
          whileInView="visible"
        >
          <div
            className="absolute inset-x-10 top-0 -z-10 h-48 rounded-full bg-[radial-gradient(circle,rgba(219,38,119,0.22),transparent_68%)] blur-2xl"
            aria-hidden="true"
          />
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
            <div className="rounded-[24px] border border-white/65 bg-white/70 p-5 text-left shadow-[0_18px_42px_rgba(52,28,90,0.08)] backdrop-blur-xl">
              <span className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))]">
                <Mail className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">Contact and waitlist</h3>
              <p className="mt-2 leading-7 text-[var(--color-muted-ink)]">
                Interested in launch updates, press, or partner access? Reach the Triad team directly.
              </p>
              <motion.a
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl brand-gradient-bg px-5 font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] transition hover:opacity-95"
                href={`mailto:${contactEmail}?subject=Triad waitlist`}
                whileTap={buttonTap}
              >
                Contact Triad
                <ArrowRight className="size-4" aria-hidden="true" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
