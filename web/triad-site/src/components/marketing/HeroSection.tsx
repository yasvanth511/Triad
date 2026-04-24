"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { DownloadButtons } from "@/components/marketing/DownloadButtons";
import { buttonTap, fadeIn, scaleIn, slideUp, staggerContainer, staggerItem } from "@/lib/animations";

const webAppUrl = process.env.NEXT_PUBLIC_TRIAD_WEB_APP_URL || "#";
const businessUrl = process.env.NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL || "#business";

export function HeroSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-28 sm:pt-32" id="home">
      <div className="soft-grid absolute inset-x-0 top-0 -z-10 h-[34rem]" aria-hidden="true" />
      <div className="site-shell grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr]">
        <motion.div
          animate="visible"
          className="max-w-3xl"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/78"
            variants={staggerItem}
          >
            <Sparkles className="size-4 text-[var(--color-cyan)]" aria-hidden="true" />
            Dating, discovery, and plans that feel more alive.
          </motion.div>
          <motion.h1
            className="display-font text-[clamp(3.4rem,10vw,7.2rem)] font-black leading-[0.86] tracking-normal"
            variants={staggerItem}
          >
            Meet better. Move together.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl"
            variants={staggerItem}
          >
            Triad helps singles, couples, and group-aware communities discover people, events, and shared
            plans with a safety-first foundation.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            variants={staggerItem}
          >
            <motion.a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-[#140a24] shadow-[0_18px_46px_rgba(255,255,255,0.18)] transition hover:bg-white/90"
              href="#download"
              whileTap={buttonTap}
            >
              Download App
              <ArrowRight className="size-4" aria-hidden="true" />
            </motion.a>
            <motion.a
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/12"
              href={webAppUrl}
              whileTap={buttonTap}
            >
              Open Web App
            </motion.a>
            <motion.a
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-transparent px-6 py-3 text-base font-semibold text-white/84 transition hover:bg-white/8 hover:text-white"
              href={businessUrl}
              whileTap={buttonTap}
            >
              For Businesses
            </motion.a>
          </motion.div>

          <motion.div className="mt-9 max-w-2xl" variants={fadeIn}>
            <DownloadButtons compact />
          </motion.div>
        </motion.div>

        <motion.div
          animate="visible"
          className="relative mx-auto w-full max-w-[33rem]"
          initial="hidden"
          variants={scaleIn}
        >
          <div className="absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,79,154,0.28),transparent_68%)] blur-2xl" />
          <motion.div
            animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
            className="premium-panel rounded-[2.5rem] p-4"
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-[2rem] border border-white/12 bg-[#150d24] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Tonight</p>
                  <p className="text-lg font-semibold text-white">Nearby plans</p>
                </div>
                <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Verified
                </span>
              </div>
              <div className="grid gap-3">
                {["Rooftop mixer", "Impress Me prompt", "Coffee walk"].map((item, index) => (
                  <div
                    className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4"
                    key={item}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{item}</p>
                        <p className="mt-1 text-sm text-white/54">
                          {index === 0 ? "8 people interested" : index === 1 ? "3 thoughtful replies" : "2.1 mi away"}
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((avatar) => (
                          <span
                            aria-hidden="true"
                            className="size-8 rounded-full border-2 border-[#150d24] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))]"
                            key={avatar}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[1.25rem] bg-white p-4 text-[#160b24]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#7c4dff]" aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6">
                    Trust controls are built around verification, reporting, blocking, and thoughtful moderation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
