# Triad Marketing UI/UX Design System

This guidance applies to the standalone public marketing website in `web/triad-site`.

## Brand Personality

- Premium, warm, socially intelligent, and safety-aware.
- Modern dating and local discovery without explicit adult language.
- Confident and inviting, not clinical, gimmicky, or overly playful.

## Color Rules

- Preserve the Triad purple and rose identity as primary brand signals.
- The marketing site may use a dark premium background with violet, rose, and cyan accents.
- Maintain high contrast for text and controls.
- Avoid muddy low-contrast gradients, single-hue monotony, and decorative color that competes with CTAs.

## Typography Rules

- Use expressive display type for major hero and section headlines.
- Use clean sans-serif body type for readability.
- Keep section headings concise and scannable.
- Do not use viewport-width font scaling; use `clamp()` with sensible bounds when responsive display type is needed.
- Letter spacing should remain normal except for small uppercase labels.

## Layout Rules

- Build mobile-first.
- Keep first viewport focused on Triad, the value proposition, CTAs, app preview, and trust signal.
- Use full-width sections with constrained inner content.
- Avoid nested cards and decorative clutter.
- Keep repeated card grids balanced and responsive.

## Button Rules

- Primary CTA: high-contrast filled button.
- Secondary CTA: restrained outline or translucent button.
- Buttons must have clear labels, visible focus/hover states, and mobile-safe tap targets.
- Do not overload the hero with too many visually equal CTAs.

## Card Rules

- Cards should be soft, premium, and readable.
- Use cards for feature items, app preview modules, download actions, and business benefits.
- Avoid deeply rounded pill-heavy layouts unless the control is intentionally a pill button.
- Keep card content concise.

## Animation Rules

- Use Framer Motion through reusable variants in `src/lib/animations.ts`.
- Keep durations under 0.5 seconds for standard entrances and interactions.
- Use no distracting loops; decorative repeat motion must be subtle and disabled for reduced motion when practical.
- Animate hero text, CTA buttons, feature cards, section reveals, download buttons, and business CTA sections only when it improves comprehension.

## Mobile Responsiveness Rules

- Primary content must work at narrow mobile widths without overlap.
- CTA stacks should become vertical on mobile.
- Cards should collapse to one column on small screens.
- App preview placeholders should keep stable dimensions and avoid horizontal scroll.

## Accessibility Rules

- Use semantic sections, nav landmarks, headings, and descriptive link text.
- Maintain high contrast against dark backgrounds.
- Preserve keyboard navigation and focus visibility.
- Mark decorative icons as `aria-hidden`.
- Do not rely on motion alone to communicate state.

## Do-Not-Change Rules

- Do not add product workflows to the marketing site.
- Do not expose admin links publicly.
- Do not change backend APIs for marketing copy or layout needs.
- Do not change mobile app behavior.
- Keep deployment changes scoped to the standalone marketing site unless a task explicitly asks for broader platform changes.
- Do not use explicit adult language or unsafe marketplace claims.
