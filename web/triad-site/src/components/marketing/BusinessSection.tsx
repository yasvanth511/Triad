"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeDollarSign, BarChart3, CalendarPlus, Trophy } from "lucide-react";

import { buttonTap, motionViewport, slideUp, staggerContainer, staggerItem } from "@/lib/animations";

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
    <section className="py-20" id="business">
      <div className="site-shell">
        <motion.div
          className="premium-panel overflow-hidden rounded-[30px] p-6 sm:p-8 lg:p-10"
          initial="hidden"
          variants={slideUp}
          viewport={motionViewport}
          whileInView="visible"
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl brand-gradient-bg px-6 font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] transition hover:opacity-95"
                  href={businessUrl}
                  whileTap={buttonTap}
                >
                  Open Business Portal
                  <ArrowRight className="size-4" aria-hidden="true" />
                </motion.a>
                <motion.a
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/80 px-6 font-semibold text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.12)] transition hover:bg-white"
                  href={`mailto:${contactEmail}?subject=Triad business access`}
                  whileTap={buttonTap}
                >
                  Request Access
                </motion.a>
              </div>
            </div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              variants={staggerContainer}
              initial="hidden"
              viewport={motionViewport}
              whileInView="visible"
            >
              {partnerBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <motion.div
                    className="rounded-[24px] border border-white/65 bg-white/65 p-5 shadow-[0_18px_42px_rgba(52,28,90,0.08)] backdrop-blur-xl"
                    key={benefit.title}
                    variants={staggerItem}
                  >
                    <span className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))]">
                      <Icon className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-[var(--color-ink)]">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted-ink)]">
                      Launch partner moments that feel native to how Triad members make social plans.
                    </p>
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
