"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { DownloadButtons } from "@/components/marketing/DownloadButtons";
import { buttonTap, fadeIn, scaleIn, staggerContainer, staggerItem } from "@/lib/animations";

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
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-muted-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.08)] backdrop-blur-xl"
            variants={staggerItem}
          >
            <Sparkles className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
            Dating, discovery, and plans that feel more alive.
          </motion.div>
          <motion.h1
            className="display-font text-[clamp(3.4rem,10vw,7.2rem)] font-black leading-[0.86] tracking-[-0.05em] brand-gradient-text"
            variants={staggerItem}
          >
            Meet better. Move together.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted-ink)] sm:text-xl"
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl brand-gradient-bg px-6 text-base font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] transition hover:opacity-95"
              href="#download"
              whileTap={buttonTap}
            >
              Download App
              <ArrowRight className="size-4" aria-hidden="true" />
            </motion.a>
            <motion.a
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/80 px-6 text-base font-semibold text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.12)] transition hover:bg-white"
              href={webAppUrl}
              whileTap={buttonTap}
            >
              Open Web App
            </motion.a>
            <motion.a
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/70 bg-white/50 px-6 text-base font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-white/80"
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
          <div className="absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(219,38,119,0.20),transparent_68%)] blur-2xl" />
          <motion.div
            animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
            className="premium-panel rounded-[2.5rem] p-4"
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-[2rem] border border-white/65 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-ink)]">
                    Tonight
                  </p>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">Nearby plans</p>
                </div>
                <span className="rounded-full bg-emerald-500/14 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              </div>
              <div className="grid gap-3">
                {["Rooftop mixer", "Impress Me prompt", "Coffee walk"].map((item, index) => (
                  <div
                    className="rounded-2xl border border-white/65 bg-white/70 p-4 shadow-[0_10px_24px_rgba(52,28,90,0.08)]"
                    key={item}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{item}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted-ink)]">
                          {index === 0
                            ? "8 people interested"
                            : index === 1
                              ? "3 thoughtful replies"
                              : "2.1 mi away"}
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((avatar) => (
                          <span
                            aria-hidden="true"
                            className="size-8 rounded-full border-2 border-white brand-gradient-bg"
                            key={avatar}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.10),rgba(219,38,119,0.10))] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 size-5 shrink-0 text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold leading-6 text-[var(--color-ink)]">
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
