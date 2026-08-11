/**
 * ActionMenuSheet.tsx
 * A bottom sheet that shows the creation options (Task, Deck, Class).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomSheet from './BottomSheet';
import { colors, radius, spacing, type, shadows } from '../app/styles/welcome.styles';

interface ActionMenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

function ActionOption({
  icon,
  color,
  bg,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.optionBtn} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

export default function ActionMenuSheet({ visible, onClose }: ActionMenuSheetProps) {
  const handleNav = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 200); // Wait for modal to close before navigating
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Create New...">
      <ActionOption
        icon="checkbox"
        color={colors.marigold}
        bg={colors.marigoldSoft}
        title="Add Task"
        subtitle="To-dos and assignments"
        onPress={() => handleNav('/pages/tasks/new')}
      />
      
      <ActionOption
        icon="layers"
        color={colors.sage}
        bg={colors.sageSoft}
        title="Add Flashcard Deck"
        subtitle="Study notes and terms"
        onPress={() => handleNav('/pages/decks/new')}
      />

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>CLASS SCHEDULE</Text>

      <ActionOption
        icon="calendar"
        color={colors.periwinkle}
        bg={colors.periwinkleSoft}
        title="Manual Class Entry"
        subtitle="Type subject, room, and time"
        onPress={() => handleNav('/pages/classes/new')}
      />

      <ActionOption
        icon="camera"
        color="#A855F7"
        bg="#F3E8FF"
        title="Scan Schedule"
        subtitle="AI will extract from an image"
        onPress={() => handleNav('/pages/classes/scan')}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionTitle: {
    ...type.label,
    fontSize: 15,
    color: colors.ink,
  },
  optionSubtitle: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...type.caption,
    color: colors.inkSoft,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
});
