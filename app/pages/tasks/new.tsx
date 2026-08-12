import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetField from '../../../components/SheetField';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { supabase } from '../../../utils/supabase';

const PRIORITIES = [
  { key: 'high', label: 'High', color: colors.marigold, bg: colors.marigoldSoft },
  { key: 'medium', label: 'Medium', color: colors.periwinkle, bg: colors.periwinkleSoft },
  { key: 'low', label: 'Low', color: colors.sage, bg: colors.sageSoft },
];

const QUICK_DUE = [
  { label: 'Today', value: 'Due today' },
  { label: 'Tomorrow', value: 'Due tomorrow' },
  { label: 'This week', value: 'Due this week' },
];

function PriorityChip({ option, isSelected, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        backgroundColor: isSelected ? option.bg : '#FFFFFF',
        borderColor: isSelected ? option.color : '#E4DDCB',
      }}
    >
      <Ionicons name={isSelected ? 'flag' : 'flag-outline'} size={14} color={isSelected ? option.color : '#8B96A8'} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? option.color : '#4A5A76' }}>
        {option.label}
      </Text>
    </Pressable>
  );
}

export default function NewTaskScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const titleShake = useRef(new Animated.Value(0)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const shakeTitleField = () => {
    titleShake.setValue(0);
    Animated.sequence([
      Animated.timing(titleShake, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(titleShake, { toValue: -1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(titleShake, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(titleShake, { toValue: 0, duration: 55, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDue(selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      setTitleError(true);
      shakeTitleField();
      return;
    }
    setTitleError(false);
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
      console.warn('AddTask error:', error.message);
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
        <Text style={styles.headerTitle}>New Task</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ translateX: titleShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] }) }] }}>
          <SheetField
            label="TASK TITLE"
            placeholder="e.g. Finish Calc II problem set"
            value={title}
            onChangeText={(text: string) => {
              setTitle(text);
              if (titleError && text.trim()) setTitleError(false);
            }}
            autoFocus
          />
          {titleError && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={13} color={colors.error} />
              <Text style={styles.errorText}>Give your task a title first</Text>
            </View>
          )}
        </Animated.View>

        <Text style={styles.sectionLabel}>DUE DATE</Text>
        <View style={styles.quickDueRow}>
          {QUICK_DUE.map((q) => {
            const isSelected = due === q.value;
            return (
              <Pressable
                key={q.value}
                style={[styles.quickDueChip, isSelected && styles.quickDueChipSelected]}
                onPress={() => setDue(isSelected ? '' : q.value)}
              >
                <Text style={[styles.quickDueText, isSelected && styles.quickDueTextSelected]}>{q.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
          <Ionicons name="calendar-outline" size={18} color={colors.inkSoft} />
          <Text style={[styles.datePickerText, due && { color: colors.ink }]}>{due || 'Select a custom date'}</Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
        )}

        <Text style={styles.sectionLabel}>PRIORITY</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <PriorityChip key={p.key} option={p} isSelected={priority === p.key} onPress={() => setPriority(p.key)} />
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Animated.View style={[styles.submitShadowWrap, { transform: [{ scale: submitScale }] }]}>
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleAdd}
            onPressIn={() => Animated.spring(submitScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start()}
            onPressOut={() => Animated.spring(submitScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color={colors.paper} /> : <>
              <Ionicons name="add-circle" size={18} color={colors.paper} />
              <Text style={styles.submitText}>Add Task</Text>
            </>}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#132A4C' },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },

  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#4A5A76', marginTop: spacing.md, marginBottom: spacing.sm, letterSpacing: 0.5 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -spacing.xs, marginBottom: spacing.xs },
  errorText: { fontSize: 12, color: colors.error },

  quickDueRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  quickDueChip: { paddingVertical: 8, paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF' },
  quickDueChipSelected: { backgroundColor: '#132A4C', borderColor: '#132A4C' },
  quickDueText: { fontSize: 12, fontWeight: '600', color: '#4A5A76' },
  quickDueTextSelected: { color: '#FFFFFF' },

  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, gap: spacing.sm, marginBottom: spacing.md },
  datePickerText: { fontSize: 15, color: '#8B96A8' },

  priorityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  priorityChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5 },

  submitShadowWrap: { borderRadius: radius.md, ...shadows.soft },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#132A4C', borderRadius: radius.md, paddingVertical: 14 },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
