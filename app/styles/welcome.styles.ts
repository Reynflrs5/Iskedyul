import { Platform, StyleSheet } from 'react-native';

// ============================================================================
// DESIGN SYSTEM — "Planner" identity
// Iskedyul — Student Planner
//
// v4: commits fully to the notebook/stationery metaphor instead of splitting
// attention between it and generic hero decoration. The three floating color
// blobs are gone (that's the default "gradient wash hero" move, not something
// specific to a planner app) — replaced with a single quiet spotlight behind
// the logo. The tracked-uppercase eyebrow above the headline — one of the
// most common templated tells — is gone too, replaced with a badge that
// reads like a sticker on a planner cover. The week strip now sits on a
// baseline rule, like marks on ruled paper, with a marker for "today" instead
// of just a color swap.
// ============================================================================

// ----------------------------------------------------------------------------
// COLOR SYSTEM — 6 named colors, used deliberately
// ----------------------------------------------------------------------------

export const colors = {
  // Ink — primary text, headlines, CTA fills
  ink: '#132A4C',
  inkDeep: '#0D1E38', // gradient partner for ink, used only on the CTA
  inkSoft: '#4A5A76',
  inkFaint: '#8B96A8',

  // Paper — background, warm rather than clinical white
  paper: '#FBF6EC',
  paperWarm: '#FFFDF8', // top-of-screen paper tone, barely lighter than paper
  paperRaised: '#FFFFFF',
  paperLine: '#EDE6D4', // rule-line color, notebook feel

  // Marigold — the highlighter accent, used sparingly for emphasis
  marigold: '#E8A23D',
  marigoldSoft: '#FBEBD2',
  marigoldInk: '#5C3D0E', // text-on-marigold

  // Periwinkle — "class" schedule blocks / secondary accent
  periwinkle: '#6C7BD1',
  periwinkleSoft: '#E9EBFA',

  // Sage — "study / done" state, success
  sage: '#3F8F86',
  sageSoft: '#E3F2EF',

  // Structural
  border: '#E4DDCB',
  borderStrong: '#CFC6AE',
  white: '#FFFFFF',
  error: '#C1543D',
  errorSoft: '#FBEAE5',

  // Shadows
  shadowInk: 'rgba(19, 42, 76, 0.18)',
  shadowSoft: 'rgba(19, 42, 76, 0.08)',
};

// ----------------------------------------------------------------------------
// TYPOGRAPHY
// ----------------------------------------------------------------------------

const FONT_DISPLAY = Platform.select({
  ios: 'Fraunces-Bold', // falls back to System if not linked
  android: 'Fraunces-Bold',
  default: 'System',
});
const FONT_BODY = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });
const FONT_MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const type = {
  display: {
    fontFamily: FONT_DISPLAY,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: FONT_DISPLAY,
    fontSize: 23,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: FONT_DISPLAY,
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15.5,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  label: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  badge: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 17,
  },
  caption: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 17,
  },
  dayLetter: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

// ----------------------------------------------------------------------------
// SPACING / RADIUS / SHADOWS
// ----------------------------------------------------------------------------

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: colors.shadowSoft,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  fold: {
    shadowColor: colors.shadowSoft,
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  cta: {
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  marker: {
    shadowColor: colors.marigold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
};

// ----------------------------------------------------------------------------
// WEEK STRIP DATA — a believable "week shape", Wed carries the accent
// ----------------------------------------------------------------------------

// Order is Monday -> Sunday to match how the strip reads left to right.
// `height` is just the visual bar height; which day is "today" (the accent
// color + marker dot) is computed live in the component from the device's
// actual date.
export const WEEK_DAYS = [
  { label: 'M', height: 16 },
  { label: 'T', height: 25 },
  { label: 'W', height: 40 },
  { label: 'T', height: 29 },
  { label: 'F', height: 21 },
  { label: 'S', height: 12 },
  { label: 'S', height: 9 },
];

// ============================================================================
// STYLESHEET
// Values that scale with screen size (logo diameter, spotlight size,
// horizontal padding) are intentionally NOT here — they're computed in the
// component with useWindowDimensions and merged in via inline style arrays.
// ============================================================================

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  spotlight: {
    position: 'absolute',
    borderRadius: 9999,
  },
  ruleLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.paperLine,
  },
  marginRule: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: colors.marigold,
    opacity: 0.28,
  },

  content: {
    flex: 1,
    alignItems: 'center',
  },

  // --- Hero (logo-centered) ---
  hero: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ribbon "bookmark" tab that appears to slot behind the logo card.
  ribbon: {
    position: 'absolute',
    top: -10,
    width: 34,
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
    backgroundColor: colors.marigold,
  },
  ribbonNotchLeft: {
    position: 'absolute',
    bottom: -7,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 17,
    borderLeftColor: 'transparent',
    borderTopWidth: 7,
    borderTopColor: colors.marigold,
  },
  ribbonNotchRight: {
    position: 'absolute',
    bottom: -7,
    right: 0,
    width: 0,
    height: 0,
    borderRightWidth: 17,
    borderRightColor: 'transparent',
    borderTopWidth: 7,
    borderTopColor: colors.marigold,
  },

  logoTab: {
    borderRadius: radius.lg,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  logoTabFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    backgroundColor: colors.paper,
    borderBottomLeftRadius: radius.sm,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    ...shadows.fold,
  },
  logo: {
    width: '128%',
    height: '128%',
    resizeMode: 'contain',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.periwinkleSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    marginTop: spacing.lg,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.periwinkle,
    marginRight: 6,
  },
  badgeText: {
    ...type.badge,
    color: colors.ink,
  },

  appName: {
    ...type.display,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  appTagline: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },

  // --- WeekStrip signature element, now a ruled "ledger" ---
  weekStripWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  weekStripRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  weekStripBarTrack: {
    width: 10,
    height: 52,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  weekStripMarker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.marigold,
    marginBottom: 5,
    ...shadows.marker,
  },
  weekStripBar: {
    width: 10,
    borderRadius: radius.pill,
  },
  weekStripBaseline: {
    width: '100%',
    height: 1,
    backgroundColor: colors.borderStrong,
    marginTop: 2,
  },
  weekStripLabelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  weekStripLabel: {
    width: 10,
    textAlign: 'center',
    ...type.dayLetter,
    color: colors.inkFaint,
  },

  // --- CTA / bottom section ---
  bottomSection: {
    width: '100%',
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  shadowsCtaWrap: {
    width: '100%',
    borderRadius: radius.pill,
    ...shadows.cta,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    width: '100%',
    overflow: 'hidden',
  },
  primaryButtonHighlight: {
    position: 'absolute',
    top: 1,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.pill,
  },
  primaryButtonText: {
    ...type.label,
    color: colors.paper,
    fontSize: 16,
  },
  secondaryRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  secondaryText: {
    ...type.body,
    color: colors.inkSoft,
  },
  secondaryLink: {
    ...type.label,
    color: colors.ink,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: colors.marigold,
  },
  termsText: {
    ...type.caption,
    color: colors.inkFaint,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  termsLink: {
    color: colors.inkSoft,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});