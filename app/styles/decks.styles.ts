import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  scrollContent: { paddingBottom: spacing.xxl },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pageTitle: { ...type.h1, color: colors.ink, fontSize: 25 },
  subtitle: { ...type.body, fontSize: 14, color: colors.inkSoft, marginBottom: spacing.lg },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Deck cards grid
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
  deckCount: { ...type.caption, color: colors.inkSoft },
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
