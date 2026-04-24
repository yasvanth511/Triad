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
          className="premium-panel overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10"
          initial="hidden"
          variants={slideUp}
          viewport={motionViewport}
          whileInView="visible"
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cyan)]">
                For Businesses
              </p>
              <h2 className="display-font mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[0.94] tracking-normal">
                Be part of the plan.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/68">
                Triad helps venues and local partners reach people who are actively discovering where to go,
                what to do, and who to meet.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#140a24] transition hover:bg-white/90"
                  href={businessUrl}
                  whileTap={buttonTap}
                >
                  Open Business Portal
                  <ArrowRight className="size-4" aria-hidden="true" />
                </motion.a>
                <motion.a
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 py-3 font-semibold text-white transition hover:bg-white/12"
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
                    className="rounded-[1.35rem] border border-white/12 bg-[#10091d]/54 p-5"
                    key={benefit.title}
                    variants={staggerItem}
                  >
                    <Icon className="size-6 text-[var(--color-cyan)]" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold text-white">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">
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
