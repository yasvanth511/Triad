"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useRef } from "react";

import { DownloadButtons } from "@/components/marketing/DownloadButtons";
import { TiltCard } from "@/components/marketing/TiltCard";
import {
  buttonTap,
  fadeIn,
  softZoom,
  staggerRevealContainer,
  staggerRevealItem,
} from "@/lib/animations";

const webAppUrl = process.env.NEXT_PUBLIC_TRIAD_WEB_APP_URL || "#";
const businessUrl = process.env.NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL || "#business";

export function HeroSection() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const blobYA = useTransform(scrollYProgress, [0, 1], ["0%", reducedMotion ? "0%" : "-30%"]);
  const blobYB = useTransform(scrollYProgress, [0, 1], ["0%", reducedMotion ? "0%" : "20%"]);
  const blobYC = useTransform(scrollYProgress, [0, 1], ["0%", reducedMotion ? "0%" : "-12%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reducedMotion ? 1 : 0.6]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden pb-20 pt-28 sm:pt-32"
      id="home"
    >
      <div className="soft-grid absolute inset-x-0 top-0 -z-10 h-[34rem]" aria-hidden="true" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ opacity: heroOpacity }}
      >
        <motion.div
          className="gradient-blob anim-drift-blob left-[-6%] top-[6%] h-[26rem] w-[26rem] bg-[radial-gradient(circle,rgba(124,77,255,0.32),transparent_70%)]"
          style={{ y: blobYA }}
        />
        <motion.div
          className="gradient-blob anim-drift-blob right-[-8%] top-[18%] h-[28rem] w-[28rem] bg-[radial-gradient(circle,rgba(219,38,119,0.28),transparent_70%)]"
          style={{ y: blobYB }}
        />
        <motion.div
          className="gradient-blob anim-drift-blob left-[34%] top-[58%] h-[22rem] w-[22rem] bg-[radial-gradient(circle,rgba(73,150,255,0.22),transparent_70%)]"
          style={{ y: blobYC }}
        />
      </motion.div>

      <div className="site-shell grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr]">
        <motion.div
          animate="visible"
          className="max-w-3xl"
          initial="hidden"
          variants={staggerRevealContainer}
        >
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-muted-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.08)] backdrop-blur-xl"
            variants={staggerRevealItem}
          >
            <Sparkles className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
            Dating, discovery, and plans that feel more alive.
          </motion.div>
          <motion.h1
            className="display-font text-[clamp(3.4rem,10vw,7.2rem)] font-black leading-[0.86] tracking-[-0.05em] brand-gradient-text"
            variants={staggerRevealItem}
          >
            Meet better. Move together.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted-ink)] sm:text-xl"
            variants={staggerRevealItem}
          >
            Triad helps singles, couples, and group-aware communities discover people, events, and shared
            plans with a safety-first foundation.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            variants={staggerRevealItem}
          >
            <motion.a
              className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl brand-gradient-bg px-6 text-base font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(119,86,223,0.36)]"
              href="#download"
              whileTap={buttonTap}
            >
              Download App
              <ArrowRight className="size-4" aria-hidden="true" />
            </motion.a>
            <motion.a
              className="focus-ring inline-flex h-12 items-center justify-center rounded-2xl bg-white/85 px-6 text-base font-semibold text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
              href={webAppUrl}
              whileTap={buttonTap}
            >
              Open Web App
            </motion.a>
            <motion.a
              className="focus-ring inline-flex h-12 items-center justify-center rounded-2xl border border-white/70 bg-white/50 px-6 text-base font-semibold text-[var(--color-ink)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-white/80"
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
          variants={softZoom}
        >
          <div
            aria-hidden="true"
            className="anim-glow-pulse absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(219,38,119,0.22),transparent_68%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="anim-orbit-slow absolute inset-0 -z-10"
          >
            <div className="absolute -left-6 top-12 h-3 w-3 rounded-full bg-[var(--color-accent)]/70 blur-[2px]" />
            <div className="absolute -right-4 bottom-20 h-4 w-4 rounded-full bg-[var(--color-secondary)]/70 blur-[2px]" />
            <div className="absolute right-12 -top-2 h-2.5 w-2.5 rounded-full bg-[var(--color-cyan)]/70 blur-[2px]" />
          </div>

          <TiltCard
            className="group"
            innerClassName="rounded-[2.5rem]"
            intensity={9}
          >
            <motion.div
              animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
              className="glass-panel edge-highlight rounded-[2.5rem] p-4"
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
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
                    <motion.div
                      className="rounded-2xl border border-white/65 bg-white/80 p-4 shadow-[0_10px_24px_rgba(52,28,90,0.08)]"
                      key={item}
                      style={{ transform: `translateZ(${18 + index * 6}px)` }}
                      whileHover={reducedMotion ? undefined : { y: -2 }}
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
                              className="size-8 rounded-full border-2 border-white brand-gradient-bg shadow-sm"
                              key={avatar}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
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
          </TiltCard>

          <motion.div
            aria-hidden="true"
            className="anim-float-slow absolute -left-6 top-10 hidden rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-xs font-semibold text-[var(--color-ink)] shadow-[0_18px_42px_rgba(52,28,90,0.18)] backdrop-blur-xl sm:block"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />
            12 nearby online
          </motion.div>
          <motion.div
            aria-hidden="true"
            className="anim-float-mid absolute -right-4 bottom-14 hidden rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-xs font-semibold text-[var(--color-ink)] shadow-[0_18px_42px_rgba(52,28,90,0.18)] backdrop-blur-xl sm:block"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Sparkles className="mr-2 inline size-3 text-[var(--color-accent)]" aria-hidden="true" />
            New match
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
