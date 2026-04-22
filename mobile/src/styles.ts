import { StyleSheet, Platform } from "react-native";
import { COLORS, RADIUS, SPACING } from "./constants";

// ─── Frosted-Glass Card Style (light tint) ─────────────────────
// Use with <BlurView intensity={55} tint="light"> wrapper
export const glass = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderGlass,
    // Drop shadow for depth on light backgrounds
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  inner: {
    backgroundColor: COLORS.surfaceGlass,
  },
});

// ─── Rich CTA Button Styles ────────────────────────────────────
export const clay = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    paddingHorizontal: SPACING.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // Violet — primary actions (Like, Sign In, Save, Join Couple)
  primary: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryStrong,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  // Rose — secondary actions (Create Couple, accent CTAs)
  secondary: {
    backgroundColor: COLORS.secondary,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.secondaryStrong,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.30,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});

// ─── Rich Base Styles (light-background variant) ───────────────
export const base = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    // Subtle card lift
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.0,
    marginBottom: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
