import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  scrollContent: { paddingBottom: spacing.xxl },

  // Avatar hero section
  heroSection: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
  avatarText: { ...type.h1, color: colors.paper, fontSize: 32 },
  userName: { ...type.h2, color: colors.ink },
  userEmail: { ...type.body, fontSize: 14, color: colors.inkSoft },

  // Stats strip
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  statNumber: { ...type.h2, color: colors.ink },
  statLabel: { ...type.caption, color: colors.inkSoft, marginTop: 2 },

  // Section group
  sectionGroup: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.soft,
  },
  sectionGroupTitle: {
    ...type.overline,
    color: colors.inkSoft,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuItemFirst: { borderTopWidth: 0 },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { ...type.label, fontSize: 15, color: colors.ink, flex: 1 },
  menuValue: { ...type.body, fontSize: 13, color: colors.inkSoft },

  // Sign out button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  signOutText: { ...type.label, color: '#E53935', fontSize: 15 },
});
