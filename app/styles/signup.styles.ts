import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  keyboardView: {
    flex: 1,
  },

  backButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
    ...shadows.soft,
  },

  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logo: {
    resizeMode: 'contain',
  },

  headerSection: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...type.overline,
    color: colors.sage,
    marginBottom: spacing.xxs,
  },
  title: {
    ...type.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
  },
  subtitle: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: spacing.xxs,
  },

  form: {
    gap: spacing.md,
    flexShrink: 1,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...type.label,
    fontSize: 13,
    color: colors.inkSoft,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    fontWeight: '500',
  },
  eyeButton: {
    padding: spacing.xxs,
  },

  signupButtonShadowWrap: {
    borderRadius: radius.pill,
    marginTop: spacing.xxs,
    ...shadows.cta,
  },
  signupButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signupButtonText: {
    ...type.label,
    color: colors.white,
    fontSize: 16,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...type.caption,
    color: colors.inkFaint,
  },

  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxs,
    gap: spacing.xxs,
  },
  signinText: {
    ...type.body,
    fontSize: 14,
    color: colors.inkSoft,
  },
  signinLink: {
    ...type.label,
    fontSize: 14,
    color: colors.ink,
    textDecorationLine: 'underline',
    textDecorationColor: colors.sage,
  },
});
