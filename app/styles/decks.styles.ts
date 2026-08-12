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
  },
  heroAccentRing: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.sage,
    opacity: 0.12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: { ...type.h1, color: colors.paper, fontSize: 25 },
  subtitle: {
    ...type.body,
    fontSize: 14,
    color: 'rgba(251,247,239,0.65)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },

  // --- Hero summary chips ---
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  heroStatChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatNumber: { ...type.h1, fontSize: 17, color: colors.paper },
  heroStatLabel: { ...type.caption, fontSize: 10.5, color: 'rgba(251,247,239,0.6)' },

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
  sheetHeaderTitle: {
    ...type.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },

  // --- Deck cards grid ---
  deckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deckCard: {
    width: '47%',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.soft,
  },
  deckIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  deckTitle: { ...type.label, fontSize: 14, color: colors.ink },
  deckMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deckTermCount: { ...type.caption, color: colors.inkSoft },
  // keep legacy names so nothing else breaks
  deckCount: { ...type.caption, color: colors.inkSoft },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressBarFill: { height: 4, borderRadius: 2 },
  // legacy aliases
  deckProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  deckProgressFill: { height: 4, borderRadius: 2, backgroundColor: colors.sage },

  emptyCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: { ...type.body, fontSize: 14, color: colors.inkFaint, textAlign: 'center' },
});