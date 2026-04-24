# AI UI Tools

Guidance for AI coding agents building or extending Triad public-facing UI.

## 21st.dev

- Use 21st.dev as inspiration for landing page structure, reusable component boundaries, and agent-friendly component patterns.
- Good references include hero blocks, feature grids, CTA sections, app download sections, and SaaS-style marketing layouts.
- Do not copy/paste components directly. Translate ideas into local Triad components that match this repository's stack and brand.
- Do not add a new UI library just because a 21st.dev component uses it. Prefer local React, Tailwind, and the existing lightweight utility pattern.
- Keep generated components accessible, responsive, and easy to review.

## Framer Motion

- Use Framer Motion only where motion clarifies hierarchy, draws attention to primary CTAs, or makes page transitions feel more polished.
- Keep variants centralized in `web/triad-site/src/lib/animations.ts`.
- Prefer short reveal animations, subtle hover states, and single-pass scroll reveals.
- Avoid distracting loops, excessive parallax, animation-heavy backgrounds, or motion that blocks content.
- Respect reduced-motion preferences where practical, especially for repeating or decorative motion.

## UI/UX Pro Max Guidance

- Treat "UI/UX Pro Max" as a quality bar: premium visual polish, excellent spacing, clear hierarchy, mobile-first composition, and strong accessibility.
- Design for a dating/social/community brand: warm, confident, modern, trustworthy, and App Store-safe.
- Use high-contrast text, clear CTAs, restrained cards, and polished app preview placeholders.
- Do not use explicit adult language, manipulative copy, inaccessible contrast, or admin/internal links.

## Agent Avoid List

- Do not turn the marketing site into the product app.
- Do not expose admin routes, admin host links, or internal tooling publicly.
- Do not modify backend, mobile, business portal, or consumer app behavior for marketing-only changes.
- Keep Docker deployment assumptions isolated to the marketing-site Dockerfile, compose service, and deployment scripts.
- Do not add heavy animation frameworks or duplicate animation libraries.
- Do not introduce one-off styling that conflicts with the design system in `docs/UI_UX_DESIGN_SYSTEM.md`.

## Consistency Checklist

- Components live under `web/triad-site/src/components/marketing`.
- Public environment variables use the `NEXT_PUBLIC_` prefix.
- Store and portal links come from env vars.
- Copy stays brand-safe and App Store-safe.
- Motion variants come from `src/lib/animations.ts`.
- Docker deploys this through the `triad-site` compose service or the `scripts/deploy/site-app.sh` image publishing flow.
