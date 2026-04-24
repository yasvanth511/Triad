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
          className="premium-panel relative overflow-hidden rounded-[2rem] p-6 text-center sm:p-10"
          initial="hidden"
          variants={scaleIn}
          viewport={motionViewport}
          whileInView="visible"
        >
          <div
            className="absolute inset-x-10 top-0 -z-10 h-48 rounded-full bg-[radial-gradient(circle,rgba(255,79,154,0.28),transparent_68%)] blur-2xl"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cyan)]">Download</p>
          <h2 className="display-font mx-auto mt-4 max-w-3xl text-[clamp(2.35rem,7vw,5rem)] font-black leading-[0.92] tracking-normal">
            Start with the app, continue anywhere.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/68">
            Store links are configured per environment, with web access available for supported flows.
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <DownloadButtons />
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-[0.62fr_1fr]">
            <div className="grid min-h-40 place-items-center rounded-[1.35rem] border border-dashed border-white/22 bg-white/6 p-5">
              <span className="text-sm font-semibold text-white/58">QR code placeholder</span>
            </div>
            <div className="rounded-[1.35rem] border border-white/12 bg-white/8 p-5 text-left">
              <Mail className="size-6 text-[var(--color-cyan)]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold text-white">Contact and waitlist</h3>
              <p className="mt-2 leading-7 text-white/62">
                Interested in launch updates, press, or partner access? Reach the Triad team directly.
              </p>
              <motion.a
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-[#140a24]"
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
