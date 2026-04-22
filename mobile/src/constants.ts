// Change this to your backend URL (use your machine's IP for physical devices)
export const API_URL = "http://10.0.2.2:5127/api"; // Android emulator -> localhost
export const SIGNALR_URL = "http://10.0.2.2:5127/hubs/chat";
export const OTEL_TRACES_URL = process.env.EXPO_PUBLIC_OTEL_TRACES_URL ?? "";

// ─── Warm Light Palette ──────────────────────────────────────
// UX direction: light background, rich visuals, no minimalism.
export const COLORS = {
  // ── Brand ──────────────────────────────────────────────────
  primary: "#7C3AED",          // Violet — main brand (deeper for contrast on light)
  primaryMuted: "#EDE9FE",     // Soft lavender tint
  primaryStrong: "#5B21B6",    // Hover / pressed state

  secondary: "#DB2777",        // Rose-pink accent
  secondaryMuted: "#FCE7F3",   // Soft blush tint
  secondaryStrong: "#9D174D",  // Pressed state

  // ── Glow / Shadow colours ──────────────────────────────────
  glowPrimary: "#7C3AED",
  glowSecondary: "#DB2777",

  // ── Surfaces ───────────────────────────────────────────────
  background: "#FAF7FF",       // Warm lavender-white — clearly NOT dark
  surface: "#FFFFFF",          // Card / section bg — pure white
  surfaceLight: "#F3EFF8",     // Slightly elevated surface (soft lilac tint)
  surfaceWarm: "#FDF2F8",      // Warm rose surface for accent sections
  surfaceGlass: "rgba(255,255,255,0.72)", // Frosted-glass fill (light variant)

  // ── Text ────────────────────────────────────────────────────
  text: "#1E1333",             // Near-black with violet warmth
  textSecondary: "#6D5D8A",    // Muted violet-grey
  textTertiary: "#A89DC0",     // Hint / placeholder

  // ── Semantic ────────────────────────────────────────────────
  accent: "#DB2777",
  success: "#059669",          // Dark enough for light bg
  warning: "#D97706",
  error: "#DC2626",

  // ── Borders ─────────────────────────────────────────────────
  border: "rgba(124,58,237,0.12)",      // Soft violet border
  borderGlass: "rgba(124,58,237,0.20)", // Glass card outline

  // ── Misc ────────────────────────────────────────────────────
  overlay: "rgba(30,19,51,0.55)",
  white: "#FFFFFF",
  black: "#000000",
};

// ─── Typography Scale ──────────────────────────────────────────
export const FONTS = {
  xs: 12,
  small: 14,
  regular: 16,
  large: 18,
  title: 22,
  hero: 30,
};

// ─── Spacing Scale ──────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border Radius ──────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
