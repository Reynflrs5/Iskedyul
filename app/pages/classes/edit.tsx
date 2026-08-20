import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetField from '../../../components/SheetField';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { supabase } from '../../../utils/supabase';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function EditClassScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [subject, setSubject] = useState(params.subject as string || '');
  const [location, setLocation] = useState(params.location as string || '');
  const [professor, setProfessor] = useState(params.professor as string || '');
  const [time, setTime] = useState(params.time as string || '');
  const [timeEnd, setTimeEnd] = useState(params.time_end as string || '');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    params.day !== undefined && params.day !== null && params.day !== ''
      ? [Number(params.day)]
      : []
  );
  const [loading, setLoading] = useState(false);

  const toggleDay = (i: number) => {
    // For editing an existing class, we only allow selecting one day at a time, 
    // because each database row is a single class block with one 'day' value.
    setSelectedDays(prev => prev.includes(i) ? [] : [i]);
  };

  const handleUpdate = async () => {
    if (!subject.trim() || !time.trim()) {
      Alert.alert('Missing Fields', 'Please enter at least a subject and start time.');
      return;
    }
    
    if (!params.id) {
      Alert.alert('Error', 'Missing class ID to update.');
      return;
    }

    setLoading(true);
    const day = selectedDays.length > 0 ? selectedDays[0] : null;
    
    const updates = {
      subject: subject.trim(),
      location: location.trim() || 'TBA',
      professor: professor.trim() || '',
      time: time.trim(),
      time_end: timeEnd.trim() || '',
      day,
    };

    const { error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', params.id);
      
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
        <Text style={styles.headerTitle}>Edit Class</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SheetField label="SUBJECT" placeholder="e.g. Calculus II" value={subject} onChangeText={setSubject} autoFocus />
        <SheetField label="ROOM / LOCATION" placeholder="e.g. Room 204" value={location} onChangeText={setLocation} />
        <SheetField label="PROFESSOR / INSTRUCTOR" placeholder="e.g. Dr. Smith" value={professor} onChangeText={setProfessor} />

        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <SheetField label="START TIME" placeholder="e.g. 9:00 AM" value={time} onChangeText={setTime} />
          </View>
          <View style={{ flex: 1 }}>
            <SheetField label="END TIME" placeholder="e.g. 10:30 AM" value={timeEnd} onChangeText={setTimeEnd} />
          </View>
        </View>

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
        <Pressable style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
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
