import { Platform, StyleSheet } from 'react-native';

// ============================================================================
// DESIGN SYSTEM — "Planner" identity
// Iskedyul — Student Planner
//
// v3: no-carousel hero layout. Logo is now the centerpiece, background
// carries ambient depth (soft color blobs + notebook rule lines) instead of
// relying on slide content, and every fixed pixel value that depended on
// screen width has moved out of StyleSheet and into the component, driven
// by useWindowDimensions so it recalculates per-device and on rotation.
// ============================================================================

// ----------------------------------------------------------------------------
// COLOR SYSTEM — 5 named colors, used deliberately
// ----------------------------------------------------------------------------

export const colors = {
  // Ink — primary text, headlines, CTA fills
  ink: '#132A4C',
  inkSoft: '#4A5A76',
  inkFaint: '#8B96A8',

  // Paper — background, warm rather than clinical white
  paper: '#FBF7EF',
  paperRaised: '#FFFFFF',
  paperLine: '#EDE6D4', // subtle rule-line color, notebook feel

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
    letterSpacing: -0.4,
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
    lineHeight: 23,
  },
  label: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 17,
  },
  overline: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
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
  cta: {
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ----------------------------------------------------------------------------
// WEEK STRIP DATA — a believable "week shape", Wed carries the accent
// ----------------------------------------------------------------------------

// Order is Monday -> Sunday to match how the strip reads left to right.
// `height` is just the visual bar height; which day is "today" (the accent
// color) is computed live in the component from the device's actual date.
export const WEEK_DAYS = [
  { label: 'M', height: 18 },
  { label: 'T', height: 27 },
  { label: 'W', height: 42 },
  { label: 'T', height: 31 },
  { label: 'F', height: 23 },
  { label: 'S', height: 14 },
  { label: 'S', height: 10 },
];

// ============================================================================
// STYLESHEET
// Values that scale with screen size (logo diameter, blob sizes, horizontal
// padding) are intentionally NOT here — they're computed in the component
// with useWindowDimensions and merged in via inline style arrays.
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
  blob: {
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
    width: 1,
    backgroundColor: colors.marigoldSoft,
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
  logoTab: {
    borderRadius: radius.lg,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  logoTabCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    backgroundColor: colors.marigoldSoft,
    borderBottomLeftRadius: radius.xs,
  },
  logo: {
    width: '128%',
    height: '128%',
    resizeMode: 'contain',
  },

  eyebrow: {
    ...type.overline,
    color: colors.inkSoft,
    marginTop: spacing.lg,
    marginBottom: spacing.xxs,
  },
  appName: {
    ...type.display,
    color: colors.ink,
    textAlign: 'center',
  },
  appTagline: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 6,
  },

  // --- WeekStrip signature element ---
  weekStripRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 7,
    height: 54,
    marginTop: spacing.lg,
    marginBottom: spacing.xxs,
  },
  weekStripBarTrack: {
    width: 9,
    height: 54,
    justifyContent: 'flex-end',
  },
  weekStripBar: {
    width: 9,
    borderRadius: radius.xs,
  },
  weekStripLabelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: spacing.md,
  },
  weekStripLabel: {
    width: 9,
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
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    width: '100%',
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