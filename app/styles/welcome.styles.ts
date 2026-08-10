import { Platform, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// DESIGN SYSTEM — "Planner" identity
// Iskedyul — Student Planner
//
// Direction: away from generic navy/white SaaS onboarding, toward the feel
// of an actual planner page — warm paper, ink, and a highlighter accent.
// The signature element is the WeekStrip: seven small bars representing
// Mon–Sun, echoing the product's actual job (building a schedule) instead
// of a decorative icon.
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
// A serif display face gives headlines character; body stays a clean
// grotesk so long copy stays easy to read. Falls back to System everywhere
// until/unless the serif is loaded — see note at bottom of file.
// ----------------------------------------------------------------------------

const FONT_DISPLAY = Platform.select({
  ios: 'Fraunces-Bold', // falls back to System if not linked — see note below
  android: 'Fraunces-Bold',
  default: 'System',
});
const FONT_BODY = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });
const FONT_MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const type = {
  display: {
    fontFamily: FONT_DISPLAY,
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 38,
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
    fontFamily: FONT_BODY,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 23,
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15.5,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  bodySmall: {
    fontFamily: FONT_BODY,
    fontSize: 13.5,
    fontWeight: '400' as const,
    lineHeight: 19,
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
  tab: {
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
};

// ============================================================================
// STYLESHEET
// ============================================================================

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },

  // --- Notebook rule-line background (signature texture, very subtle) ---
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

  // --- Top branding ---
  brandHeader: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  // "Planner tab" logo badge — rounded rect with a folded corner notch,
  // instead of a plain circle/rounded-square icon container.
  logoTab: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  logoTabCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: colors.marigoldSoft,
    borderBottomLeftRadius: radius.xs,
  },
  logo: {
    width: 46,
    height: 46,
    resizeMode: 'contain',
  },

  eyebrow: {
    ...type.overline,
    color: colors.inkSoft,
    marginBottom: spacing.xxs,
  },
  appName: {
    ...type.display,
    color: colors.ink,
  },
  appTagline: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: SCREEN_WIDTH * 0.78,
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

  // --- Carousel ---
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slideCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideGlyph: {
    width: 56,
    height: 56,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    ...type.h1,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  slideSubtitle: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH * 0.78,
  },

  // --- Pagination — small "pencil tick" marks rather than plain dots ---
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.marigold,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.border,
  },

  // --- CTA / bottom section ---
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
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
    ...shadows.cta,
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

// ----------------------------------------------------------------------------
// NOTE on the display font:
// FONT_DISPLAY points at 'Fraunces-Bold', a serif with real character for
// headlines. It will silently fall back to the system font until it's
// linked. To enable it:
//   npx expo install @expo-google-fonts/fraunces expo-font
// then load Fraunces_700Bold via useFonts() before rendering, and change
// FONT_DISPLAY above to the loaded family name. Everything else in this
// file works fine without that step — it's a pure visual upgrade, not a
// dependency.
// ----------------------------------------------------------------------------