import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetField from '../../../components/SheetField';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { supabase } from '../../../utils/supabase';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NewClassScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [professor, setProfessor] = useState('');
  const [time, setTime] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTimeDate, setStartTimeDate] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [endTimeDate, setEndTimeDate] = useState(() => {
    const d = new Date();
    d.setHours(10, 30, 0, 0);
    return d;
  });

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      setStartTimeDate(selectedDate);
      setTime(selectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setEndTimeDate(selectedDate);
      setTimeEnd(selectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }
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

    const days = selectedDays.length > 0 ? selectedDays : [null];
    const inserts = days.map((day) => ({
      subject: subject.trim(),
      location: location.trim() || 'TBA',
      professor: professor.trim() || '',
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
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Manual Entry</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SheetField label="SUBJECT" placeholder="e.g. Calculus II" value={subject} onChangeText={setSubject} autoFocus />
        <SheetField label="ROOM / LOCATION" placeholder="e.g. Room 204" value={location} onChangeText={setLocation} />
        <SheetField label="PROFESSOR / INSTRUCTOR" placeholder="e.g. Dr. Smith" value={professor} onChangeText={setProfessor} />

        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => setShowStartTimePicker(true)}>
              <View pointerEvents="none">
                <SheetField label="START TIME" placeholder="Select Time" value={time} />
              </View>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => setShowEndTimePicker(true)}>
              <View pointerEvents="none">
                <SheetField label="END TIME" placeholder="Select Time" value={timeEnd} />
              </View>
            </Pressable>
          </View>
        </View>
        
        {showStartTimePicker && (
          <DateTimePicker value={startTimeDate} mode="time" display="default" onChange={handleStartTimeChange} />
        )}
        {showEndTimePicker && (
          <DateTimePicker value={endTimeDate} mode="time" display="default" onChange={handleEndTimeChange} />
        )}

        <Text style={styles.sectionLabel}>DAYS</Text>
        <View style={styles.daysRow}>
          {DAYS.map((day, i) => {
            const active = selectedDays.includes(i);
            return (
              <Pressable key={day} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => toggleDay(i)}>
                <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleAdd} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Adding...' : 'Add Class'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { ...type.h2, color: colors.ink },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  sectionLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600', marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paperRaised },
  dayChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600' },
  dayLabelActive: { color: colors.paper },
  submitBtn: { backgroundColor: colors.periwinkle, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadows.soft },
  submitText: { ...type.label, color: colors.paper, fontSize: 15 },
});
