"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeDollarSign, BarChart3, CalendarPlus, Trophy } from "lucide-react";

import { TiltCard } from "@/components/marketing/TiltCard";
import {
  buttonTap,
  motionViewport,
  revealLeft,
  staggerRevealContainer,
  staggerRevealItem,
} from "@/lib/animations";

const businessUrl = process.env.NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL || "#";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triad.app";

const partnerBenefits = [
  { title: "Create events", icon: CalendarPlus },
  { title: "Promote offers", icon: BadgeDollarSign },
  { title: "Publish challenges", icon: Trophy },
  { title: "Track engagement", icon: BarChart3 },
];

export function BusinessSection() {
  return (
    <section className="relative py-20" id="business">
      <div
        aria-hidden="true"
        className="gradient-blob anim-drift-blob -z-10 left-[6%] top-[14%] h-[20rem] w-[20rem] bg-[radial-gradient(circle,rgba(73,150,255,0.16),transparent_70%)]"
      />
      <div className="site-shell">
        <motion.div
          className="glass-panel edge-highlight relative overflow-hidden rounded-[30px] p-6 sm:p-8 lg:p-10"
          initial="hidden"
          variants={revealLeft}
          viewport={motionViewport}
          whileInView="visible"
        >
          <div
            aria-hidden="true"
            className="anim-glow-pulse absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(219,38,119,0.22),transparent_70%)] blur-2xl"
          />
          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              initial="hidden"
              variants={revealLeft}
              viewport={motionViewport}
              whileInView="visible"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                For Businesses
              </p>
              <h2 className="display-font mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[0.94] tracking-[-0.05em] brand-gradient-text">
                Be part of the plan.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[var(--color-muted-ink)]">
                Triad helps venues and local partners reach people who are actively discovering where to go,
                what to do, and who to meet.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.a
                  className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl brand-gradient-bg px-6 font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(119,86,223,0.36)]"
                  href={businessUrl}
                  whileTap={buttonTap}
                >
                  Open Business Portal
                  <ArrowRight className="size-4" aria-hidden="true" />
                </motion.a>
                <motion.a
                  className="focus-ring inline-flex h-12 items-center justify-center rounded-2xl bg-white/85 px-6 font-semibold text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
                  href={`mailto:${contactEmail}?subject=Triad business access`}
                  whileTap={buttonTap}
                >
                  Request Access
                </motion.a>
              </div>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              variants={staggerRevealContainer}
              initial="hidden"
              viewport={motionViewport}
              whileInView="visible"
            >
              {partnerBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <motion.div key={benefit.title} variants={staggerRevealItem}>
                    <TiltCard className="group h-full" innerClassName="rounded-[24px]" intensity={5}>
                      <div className="glass-panel sheen relative h-full rounded-[24px] p-5 transition-shadow duration-300 group-hover:shadow-[0_30px_60px_-22px_rgba(52,28,90,0.32)]">
                        <span
                          className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.18),rgba(219,38,119,0.16))]"
                          style={{ transform: "translateZ(18px)" }}
                        >
                          <Icon className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
                        </span>
                        <h3
                          className="mt-5 text-lg font-semibold text-[var(--color-ink)]"
                          style={{ transform: "translateZ(12px)" }}
                        >
                          {benefit.title}
                        </h3>
                        <p
                          className="mt-2 text-sm leading-6 text-[var(--color-muted-ink)]"
                          style={{ transform: "translateZ(6px)" }}
                        >
                          Launch partner moments that feel native to how Triad members make social plans.
                        </p>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
