/**
 * AddClassSheet.tsx
 * Bottom sheet form to add a new class/subject to Supabase.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import BottomSheet from './BottomSheet';
import SheetField from './SheetField';
import { colors, radius, spacing, type, shadows } from '../app/styles/welcome.styles';
import { supabase } from '../utils/supabase';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface AddClassSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddClassSheet({ visible, onClose, onAdded }: AddClassSheetProps) {
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setSubject(''); setLocation(''); setTime(''); setTimeEnd(''); setSelectedDays([]);
  };

  const toggleDay = (i: number) =>
    setSelectedDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]);

  const handleAdd = async () => {
    if (!subject.trim() || !time.trim()) {
      Alert.alert('Missing Fields', 'Please enter at least a subject and start time.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Insert one row per selected day (or one row if no day selected)
    const days = selectedDays.length > 0 ? selectedDays : [null];
    const inserts = days.map((day) => ({
      subject: subject.trim(),
      location: location.trim() || 'TBA',
      time: time.trim(),
      time_end: timeEnd.trim() || '',
      day,
      user_id: user?.id,
    }));

    const { error } = await supabase.from('classes').insert(inserts);
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
    <BottomSheet visible={visible} onClose={onClose} title="Add Class">
      <SheetField
        label="SUBJECT"
        placeholder="e.g. Calculus II"
        value={subject}
        onChangeText={setSubject}
        autoFocus
      />
      <SheetField
        label="ROOM / LOCATION"
        placeholder="e.g. Room 204"
        value={location}
        onChangeText={setLocation}
      />

      {/* Time row side by side */}
      <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <SheetField
            label="START TIME"
            placeholder="e.g. 9:00 AM"
            value={time}
            onChangeText={setTime}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SheetField
            label="END TIME"
            placeholder="e.g. 10:30 AM"
            value={timeEnd}
            onChangeText={setTimeEnd}
          />
        </View>
      </View>

      {/* Day selector */}
      <Text style={styles.sectionLabel}>DAYS</Text>
      <View style={styles.daysRow}>
        {DAYS.map((day, i) => {
          const active = selectedDays.includes(i);
          return (
            <Pressable
              key={day}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? 'Adding...' : 'Add Class'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  sectionLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600', marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.paperRaised,
  },
  dayChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600' },
  dayLabelActive: { color: colors.paper },
  submitBtn: {
    backgroundColor: colors.periwinkle, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.sm,
    ...shadows.soft,
  },
  submitText: { ...type.label, color: colors.paper, fontSize: 15 },
});
