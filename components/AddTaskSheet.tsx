/**
 * AddTaskSheet.tsx
 * Bottom sheet form to add a new task directly to Supabase.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import BottomSheet from './BottomSheet';
import SheetField from './SheetField';
import { colors, radius, spacing, type, shadows } from '../app/styles/welcome.styles';
import { supabase } from '../utils/supabase';

const PRIORITIES = [
  { key: 'high', label: 'High', color: colors.marigold, bg: colors.marigoldSoft },
  { key: 'medium', label: 'Medium', color: colors.periwinkle, bg: colors.periwinkleSoft },
  { key: 'low', label: 'Low', color: colors.sage, bg: colors.sageSoft },
];

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddTaskSheet({ visible, onClose, onAdded }: AddTaskSheetProps) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDue(''); setPriority('medium'); };

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a task title.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      due: due.trim() || 'No due date',
      priority,
      done: false,
      user_id: user?.id,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      reset();
      onAdded();
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Task">
      <SheetField
        label="TASK TITLE"
        placeholder="e.g. Finish Calc II problem set"
        value={title}
        onChangeText={setTitle}
        autoFocus
      />
      <SheetField
        label="DUE DATE"
        placeholder="e.g. Due tomorrow, Due Fri"
        value={due}
        onChangeText={setDue}
      />

      {/* Priority selector */}
      <Text style={styles.sectionLabel}>PRIORITY</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p.key}
            style={[
              styles.priorityChip,
              { backgroundColor: p.bg, borderColor: priority === p.key ? p.color : 'transparent' },
            ]}
            onPress={() => setPriority(p.key)}
          >
            <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
            <Text style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? 'Adding...' : 'Add Task'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600', marginBottom: spacing.sm },
  priorityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  priorityChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 2,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { ...type.label, fontSize: 13 },
  submitBtn: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.sm,
    ...shadows.soft,
  },
  submitText: { ...type.label, color: colors.paper, fontSize: 15 },
});
