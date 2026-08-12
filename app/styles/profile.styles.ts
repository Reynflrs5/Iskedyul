import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink, // hero sits flush at the top, no seam
  },
  scrollContent: {
    flexGrow: 1,
  },

  // --- Hero panel ---
  hero: {
    backgroundColor: colors.ink,
    paddingBottom: 40,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroAccentRing: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.marigold,
    opacity: 0.1,
  },
  heroSettingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { ...type.h1, color: colors.paper, fontSize: 30 },
  userName: { ...type.h2, color: colors.paper },
  userEmail: { ...type.body, fontSize: 13, color: 'rgba(251,247,239,0.6)', marginTop: 2 },

  // --- Hero stats row (translucent chips) ---
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
  },
  statNumber: { ...type.h2, color: colors.paper, fontSize: 19 },
  statLabel: { ...type.caption, color: 'rgba(251,247,239,0.6)', marginTop: 2 },

  // --- Content sheet ---
  contentSheet: {
    flex: 1,
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    marginTop: -24,
    paddingTop: spacing.lg,
    ...shadows.cta,
    shadowOpacity: 0.12,
  },

  // --- Section group ---
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

  // --- Sign out button ---
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