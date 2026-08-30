import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, type, spacing, radius, shadows } from '../styles/welcome.styles';
import { supabase } from '../../utils/supabase';

type AbsenceRecord = {
  id?: string;
  subject: string;
  count: number;
  max_cuts: number;
};

export default function AttendanceTrackerScreen() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load from DB (Sync with schedule classes)
  const loadRecords = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 1. Get unique subjects from schedule
    const { data: classesData } = await supabase
      .from('classes')
      .select('subject')
      .eq('user_id', user.id);
      
    const uniqueSubjects = Array.from(new Set((classesData ?? []).map(c => c.subject).filter(Boolean))) as string[];

    // 2. Get existing absence records
    const { data: absencesData } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', user.id);

    const absencesMap = new Map((absencesData ?? []).map(a => [a.subject, a]));

    // 3. Merge them
    const merged: AbsenceRecord[] = uniqueSubjects.map(subject => {
      const existing = absencesMap.get(subject);
      if (existing) {
        return {
          id: existing.id,
          subject: existing.subject,
          count: existing.count,
          max_cuts: existing.max_cuts
        };
      } else {
        // Unsaved default
        return {
          subject,
          count: 0,
          max_cuts: 3
        };
      }
    });

    setRecords(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Add / Remove Cut
  const handleUpdateCut = async (record: AbsenceRecord, change: number) => {
    const newCount = Math.max(0, record.count + change);
    if (newCount === record.count) return;

    setUpdatingId(record.subject);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (record.id) {
      // Update existing
      const { error } = await supabase
        .from('absences')
        .update({ count: newCount, updated_at: new Date().toISOString() })
        .eq('id', record.id);
        
      if (!error) {
        setRecords(prev => prev.map(r => r.id === record.id ? { ...r, count: newCount } : r));
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('absences')
        .insert({
          user_id: user.id,
          subject: record.subject,
          count: newCount,
          max_cuts: record.max_cuts
        })
        .select()
        .single();
        
      if (!error && data) {
        setRecords(prev => prev.map(r => r.subject === record.subject ? { ...r, id: data.id, count: newCount } : r));
      } else {
        Alert.alert('Error', error?.message || 'Failed to save');
      }
    }
    
    setUpdatingId(null);
  };

  // Change Max Cuts limit
  const handleChangeMax = (record: AbsenceRecord) => {
    Alert.prompt(
      'Maximum Cuts',
      `Set max allowable absences for ${record.subject}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: async (val?: string) => {
            const num = parseInt(val || '0', 10);
            if (isNaN(num) || num < 1) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUpdatingId(record.subject);
            if (record.id) {
              const { error } = await supabase.from('absences').update({ max_cuts: num }).eq('id', record.id);
              if (!error) setRecords(prev => prev.map(r => r.id === record.id ? { ...r, max_cuts: num } : r));
            } else {
              const { data, error } = await supabase.from('absences').insert({ user_id: user.id, subject: record.subject, count: record.count, max_cuts: num }).select().single();
              if (!error && data) setRecords(prev => prev.map(r => r.subject === record.subject ? { ...r, id: data.id, max_cuts: num } : r));
            }
            setUpdatingId(null);
          } 
        }
      ],
      'plain-text',
      record.max_cuts.toString(),
      'numeric'
    );
  };

  // Colors based on danger level
  const getStatusColor = (count: number, max: number) => {
    const ratio = count / max;
    if (ratio >= 1) return '#C1543D'; // Danger / Failed
    if (ratio >= 0.6) return colors.marigold; // Warning
    return colors.sage; // Safe
  };

  const getStatusText = (count: number, max: number) => {
    if (count >= max) return 'CRITICAL (Max Reached)';
    if (count === max - 1) return 'WARNING (1 Cut Left)';
    return 'SAFE';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 36 }} /> 
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={colors.periwinkle} />
        <Text style={styles.infoText}>
          Track your cuts/absences. Subjects are loaded automatically from your schedule.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.periwinkle} />
        </View>
      ) : records.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Ionicons name="calendar-clear-outline" size={48} color={colors.border} />
          <Text style={{ ...type.label, color: colors.inkFaint, marginTop: spacing.md }}>No subjects found in your schedule.</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {records.map(record => {
            const statusColor = getStatusColor(record.count, record.max_cuts);
            const isUpdating = updatingId === record.subject;
            
            return (
              <View key={record.subject} style={[styles.card, { borderColor: statusColor + '40' }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.subjectName}>{record.subject}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusText(record.count, record.max_cuts)}</Text>
                  </View>
                </View>
                
                <View style={styles.controlsRow}>
                  <View>
                    <Text style={styles.countLabel}>Total Absences</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={[styles.countValue, { color: statusColor }]}>{record.count}</Text>
                      <Text style={styles.countMax}>/ {record.max_cuts}</Text>
                    </View>
                    <Pressable onPress={() => handleChangeMax(record)}>
                      <Text style={styles.editMaxText}>Edit Limit</Text>
                    </Pressable>
                  </View>
                  
                  <View style={styles.stepper}>
                    <Pressable 
                      style={[styles.stepBtn, record.count === 0 && { opacity: 0.3 }]} 
                      onPress={() => handleUpdateCut(record, -1)}
                      disabled={record.count === 0 || isUpdating}
                    >
                      <Ionicons name="remove" size={24} color={colors.ink} />
                    </Pressable>
                    
                    <View style={styles.stepValueBox}>
                      {isUpdating ? <ActivityIndicator size="small" color={colors.ink} /> : <Text style={styles.stepValue}>{record.count}</Text>}
                    </View>
                    
                    <Pressable 
                      style={[styles.stepBtn, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]} 
                      onPress={() => handleUpdateCut(record, 1)}
                      disabled={isUpdating}
                    >
                      <Ionicons name="add" size={24} color={statusColor} />
                    </Pressable>
                  </View>
                </View>
                
                {/* Visual Bar */}
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { backgroundColor: statusColor, width: `${Math.min((record.count / record.max_cuts) * 100, 100)}%` }]} />
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.pill,
    backgroundColor: colors.paperRaised, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { ...type.h2, color: colors.ink },
  
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.periwinkleSoft,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.periwinkle + '30',
  },
  infoText: { ...type.caption, color: colors.periwinkle, flex: 1 },
  
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  subjectName: { ...type.h2, color: colors.ink, flex: 1, marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs },
  badgeText: { ...type.caption, fontWeight: '800', fontSize: 10 },
  
  controlsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  countLabel: { ...type.caption, color: colors.inkFaint },
  countValue: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  countMax: { ...type.label, color: colors.inkFaint },
  editMaxText: { ...type.caption, color: colors.periwinkle, textDecorationLine: 'underline', marginTop: 2 },
  
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  stepBtn: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  stepValueBox: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { ...type.h2, color: colors.ink },
  
  barTrack: {
    height: 8, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden'
  },
  barFill: { height: '100%', borderRadius: radius.pill },
});
