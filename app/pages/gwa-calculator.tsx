import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, Animated, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../utils/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, type, spacing, radius, shadows } from '../styles/welcome.styles';

// ─── Philippine GWA Grade Scale ────────────────────────────────────────────
const GRADE_PRESETS = [
  { label: '1.00', value: 1.00 },
  { label: '1.25', value: 1.25 },
  { label: '1.50', value: 1.50 },
  { label: '1.75', value: 1.75 },
  { label: '2.00', value: 2.00 },
  { label: '2.25', value: 2.25 },
  { label: '2.50', value: 2.50 },
  { label: '2.75', value: 2.75 },
  { label: '3.00', value: 3.00 },
  { label: '5.00', value: 5.00 },
];

function getHonors(gwa: number): { label: string; color: string; bg: string } {
  if (gwa <= 1.20) return { label: 'Summa Cum Laude', color: '#B7791F', bg: '#FFFBEB' };
  if (gwa <= 1.45) return { label: 'Magna Cum Laude', color: '#6C7BD1', bg: '#E9EBFA' };
  if (gwa <= 1.75) return { label: 'Cum Laude', color: '#3F8F86', bg: '#E3F2EF' };
  if (gwa <= 2.00) return { label: "Dean's Lister", color: '#2563EB', bg: '#EFF6FF' };
  if (gwa < 3.01) return { label: 'Passed', color: '#3F8F86', bg: '#E3F2EF' };
  return { label: 'Failed', color: '#C1543D', bg: '#FBEAE5' };
}

// ─── Types ──────────────────────────────────────────────────────────────────
type Subject = {
  id: string;
  name: string;
  units: string;
  grade: string;
};

type GwaRecord = {
  id: string;        // uuid from Supabase
  title: string;
  gwa: number;
  honors: string;
  subjects: Subject[];
  saved_at: string;  // timestamptz from Supabase
};

// ─── Row Component ──────────────────────────────────────────────────────────
function SubjectRow({
  subject, index, onChange, onRemove, showGradeSheet,
}: {
  subject: Subject;
  index: number;
  onChange: (id: string, field: keyof Subject, value: string) => void;
  onRemove: (id: string) => void;
  showGradeSheet: (id: string) => void;
}) {
  const gradeNum = parseFloat(subject.grade);
  const gradeValid = !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 5;

  return (
    <View style={rowStyles.container}>
      {/* Index badge */}
      <View style={rowStyles.indexBadge}>
        <Text style={rowStyles.indexText}>{index + 1}</Text>
      </View>

      {/* Subject name */}
      <View style={{ flex: 1 }}>
        <TextInput
          style={rowStyles.nameInput}
          value={subject.name}
          onChangeText={(v) => onChange(subject.id, 'name', v)}
          placeholder="Subject"
          placeholderTextColor={colors.inkFaint}
        />
      </View>

      {/* Units */}
      <TextInput
        style={rowStyles.unitsInput}
        value={subject.units}
        onChangeText={(v) => onChange(subject.id, 'units', v.replace(/[^0-9.]/g, ''))}
        placeholder="Units"
        placeholderTextColor={colors.inkFaint}
        keyboardType="decimal-pad"
      />

      {/* Grade — tap to open preset picker */}
      <Pressable
        style={[rowStyles.gradeBtn, gradeValid && { backgroundColor: colors.sageSoft, borderColor: colors.sage }]}
        onPress={() => showGradeSheet(subject.id)}
      >
        <Text style={[rowStyles.gradeBtnText, gradeValid && { color: colors.sage }]}>
          {subject.grade || 'Grade'}
        </Text>
      </Pressable>

      {/* Remove */}
      <Pressable onPress={() => onRemove(subject.id)} hitSlop={10} style={rowStyles.removeBtn}>
        <Ionicons name="close-circle" size={20} color={colors.inkFaint} />
      </Pressable>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  indexBadge: {
    width: 24, height: 24, borderRadius: radius.pill,
    backgroundColor: colors.periwinkleSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  indexText: { ...type.caption, color: colors.periwinkle, fontWeight: '700' },
  nameInput: {
    ...type.body, color: colors.ink, fontSize: 14,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  unitsInput: {
    ...type.body, color: colors.ink, fontSize: 14,
    width: 52, textAlign: 'center',
    paddingVertical: 6, paddingHorizontal: 4,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xs, backgroundColor: colors.paperRaised,
  },
  gradeBtn: {
    width: 62, height: 34, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.paperRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  gradeBtnText: { ...type.caption, fontWeight: '700', color: colors.inkSoft, fontSize: 13 },
  removeBtn: { padding: 2 },
});

// ─── Grade Preset Picker (modal-less inline sheet) ──────────────────────────
function GradePickerSheet({
  visible, onSelect, onClose,
}: {
  visible: boolean; onSelect: (g: string) => void; onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevVisible = useRef(false);
  const isVisible = useRef(false);
  if (prevVisible.current !== visible) {
    prevVisible.current = visible;
    if (visible) isVisible.current = true;
    Animated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      damping: 20, stiffness: 200,
    }).start(() => {
      if (!visible) isVisible.current = false;
    });
  }

  if (!isVisible.current && !visible) return null;

  return (
    <Animated.View style={[
      pickerStyles.sheet,
      { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] },
    ]}>
      <View style={pickerStyles.handle} />
      <View style={pickerStyles.headerRow}>
        <Text style={[type.h2, { color: colors.ink }]}>Select Grade</Text>
        <Pressable onPress={onClose} hitSlop={8} style={pickerStyles.closeBtn}>
          <Ionicons name="close" size={18} color={colors.inkSoft} />
        </Pressable>
      </View>
      <View style={pickerStyles.grid}>
        {GRADE_PRESETS.map((p) => (
          <Pressable
            key={p.label}
            style={[pickerStyles.chip, p.value === 5.0 && pickerStyles.chipFail]}
            onPress={() => { onSelect(p.label); onClose(); }}
          >
            <Text style={[pickerStyles.chipText, p.value === 5.0 && { color: '#C1543D' }]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={pickerStyles.hint}>Or type a custom grade directly in the row</Text>
    </Animated.View>
  );
}

const pickerStyles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl,
    ...shadows.cta,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  closeBtn: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    width: 72, height: 44, borderRadius: radius.md,
    backgroundColor: colors.sageSoft, borderWidth: 1.5, borderColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  chipFail: { backgroundColor: '#FBEAE5', borderColor: '#C1543D' },
  chipText: { ...type.label, color: colors.sage, fontSize: 15 },
  hint: { ...type.caption, color: colors.inkFaint, textAlign: 'center' },
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
let _id = 0;
const makeId = () => `sub_${++_id}`;
const makeRow = (name = ''): Subject => ({ id: makeId(), name, units: '3', grade: '' });



export default function GwaCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedRecords, setSavedRecords] = useState<GwaRecord[]>([]);
  const [activeGradePicker, setActiveGradePicker] = useState<string | null>(null);

  // ── Load subjects from schedule ──────────────────────────────────────────
  const loadSubjectsFromSchedule = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setSubjects([makeRow()]); return; }

    const { data: classRows } = await supabase
      .from('classes')
      .select('subject')
      .eq('user_id', user.id);

    const uniqueSubjects = Array.from(
      new Set((classRows ?? []).map((c) => c.subject).filter(Boolean))
    ) as string[];

    if (uniqueSubjects.length > 0) {
      setSubjects(uniqueSubjects.map((name) => makeRow(name)));
    } else {
      // No schedule yet — fall back to 3 blank rows
      setSubjects([makeRow(), makeRow(), makeRow()]);
    }
    setLoading(false);
  }, []);

  // ── Load saved records from Supabase ────────────────────────────────────
  const loadSavedRecords = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('gwa_records')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });
    if (!error && data) setSavedRecords(data as GwaRecord[]);
  }, []);

  useEffect(() => {
    loadSubjectsFromSchedule();
    loadSavedRecords();
  }, [loadSubjectsFromSchedule, loadSavedRecords]);

  // ── Compute GWA ──────────────────────────────────────────────────────────
  const computeGwa = () => {
    let totalWeighted = 0;
    let totalUnits = 0;
    for (const s of subjects) {
      const u = parseFloat(s.units);
      const g = parseFloat(s.grade);
      if (!isNaN(u) && !isNaN(g) && u > 0 && g >= 1 && g <= 5) {
        totalWeighted += u * g;
        totalUnits += u;
      }
    }
    if (totalUnits === 0) return null;
    return totalWeighted / totalUnits;
  };

  const gwa = computeGwa();
  const honors = gwa !== null ? getHonors(gwa) : null;
  const filledCount = subjects.filter(
    (s) => parseFloat(s.units) > 0 && parseFloat(s.grade) >= 1
  ).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (id: string, field: keyof Subject, value: string) => {
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAdd = () => {
    setSubjects((prev) => [...prev, makeRow()]);
  };

  const handleRemove = (id: string) => {
    if (subjects.length === 1) {
      Alert.alert('Cannot Remove', 'You need at least one subject.');
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleReset = () => {
    Alert.alert('Reset grades?', 'This will clear all grades and reload from your schedule.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { loadSubjectsFromSchedule(); setTitle(''); } },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Add a Title', 'Please add a title like "1st Sem" before saving.');
      return;
    }
    if (gwa === null) {
      Alert.alert('No GWA Yet', 'Please fill in at least one grade before saving.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id,
      title: title.trim(),
      gwa,
      honors: honors!.label,
      subjects: subjects.filter(s => parseFloat(s.grade) >= 1),
    };
    const { data, error } = await supabase
      .from('gwa_records')
      .insert(payload)
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Save Failed', error.message);
    } else {
      setSavedRecords(prev => [data as GwaRecord, ...prev]);
      Alert.alert('Saved! 🎉', `"${title.trim()}" saved with GWA ${gwa.toFixed(4)}.`);
    }
  };

  const handleDeleteRecord = (id: string) => {
    Alert.alert('Delete Record', 'Remove this saved GWA record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('gwa_records').delete().eq('id', id);
          if (!error) setSavedRecords(prev => prev.filter(r => r.id !== id));
        },
      },
    ]);
  };

  const handleLoadRecord = (record: GwaRecord) => {
    Alert.alert('Load Record', `Load "${record.title}"? This will replace your current grades.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load',
        onPress: () => {
          setTitle(record.title);
          setSubjects(record.subjects.map(s => ({ ...s, id: makeId() })));
        },
      },
    ]);
  };

  const handleGradeSelect = (grade: string) => {
    if (activeGradePicker) handleChange(activeGradePicker, 'grade', grade);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>GWA Calculator</Text>
          <Text style={s.headerSub}>Philippine Grading System (1.0–5.0)</Text>
        </View>
        <Pressable onPress={handleReset} hitSlop={10}>
          <Text style={s.resetText}>Reset</Text>
        </Pressable>
      </View>

      {/* ── Title input + Save button ── */}
      <View style={s.titleBar}>
        <TextInput
          style={s.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. 1st Sem, AY 2025–2026"
          placeholderTextColor={colors.inkFaint}
        />
        <Pressable
          style={[s.saveBtn, (saving || gwa === null) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving || gwa === null}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.paper} />
            : <>
              <Ionicons name="save-outline" size={15} color={colors.paper} />
              <Text style={s.saveBtnText}>Save</Text>
            </>
          }
        </Pressable>
      </View>

      {/* ── GWA Result Card ── */}
      <View style={[s.resultCard, honors && { borderColor: honors.color, backgroundColor: honors.bg }]}>
        {gwa !== null ? (
          <>
            <Text style={[s.gwaValue, { color: honors!.color }]}>{gwa.toFixed(4)}</Text>
            <Text style={[s.honorsLabel, { color: honors!.color }]}>{honors!.label}</Text>
            <Text style={s.subjectsUsed}>{filledCount} subject{filledCount !== 1 ? 's' : ''} computed</Text>
          </>
        ) : (
          <>
            <Text style={s.gwaPlaceholder}>—</Text>
            <Text style={s.gwaHint}>Fill in grades to compute your GWA</Text>
          </>
        )}
      </View>

      {/* ── Scale reference ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scaleRow} contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.md }}>
        {[
          { label: 'Summa', range: '≤ 1.20', color: '#B7791F' },
          { label: 'Magna', range: '≤ 1.45', color: colors.periwinkle },
          { label: 'Cum Laude', range: '≤ 1.75', color: colors.sage },
          { label: "Dean's", range: '≤ 2.00', color: '#2563EB' },
          { label: 'Passed', range: '≤ 3.00', color: colors.inkSoft },
          { label: 'Failed', range: '5.00', color: '#C1543D' },
        ].map((item) => (
          <View key={item.label} style={[s.scaleChip, { borderColor: item.color + '55', backgroundColor: item.color + '12' }]}>
            <Text style={[s.scaleChipLabel, { color: item.color }]}>{item.label}</Text>
            <Text style={[s.scaleChipRange, { color: item.color }]}>{item.range}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Column headers ── */}
      <View style={s.colHeaders}>
        <View style={{ width: 24 }} />
        <Text style={[s.colHeader, { flex: 1, paddingLeft: 6 }]}>SUBJECT</Text>
        <Text style={[s.colHeader, { width: 52, textAlign: 'center' }]}>UNITS</Text>
        <Text style={[s.colHeader, { width: 62, textAlign: 'center' }]}>GRADE</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ── Subject rows ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
          <ActivityIndicator size="large" color={colors.periwinkle} />
          <Text style={[type.caption, { color: colors.inkFaint }]}>Loading your subjects…</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {subjects.map((sub, i) => (
            <SubjectRow
              key={sub.id}
              subject={sub}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
              showGradeSheet={(id) => setActiveGradePicker(id)}
            />
          ))}

          {/* Add extra subject button */}
          <Pressable style={s.addBtn} onPress={handleAdd}>
            <Ionicons name="add-circle-outline" size={18} color={colors.periwinkle} />
            <Text style={s.addBtnText}>Add Subject</Text>
          </Pressable>

          {/* ── Saved Records ── */}
          {savedRecords.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={s.historyTitle}>SAVED RECORDS</Text>
              {savedRecords.map((rec) => {
                const h = getHonors(rec.gwa);
                return (
                  <Pressable key={rec.id} onPress={() => handleLoadRecord(rec)}
                    style={[s.historyCard, { borderLeftColor: h.color }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.historyCardTitle}>{rec.title}</Text>
                      <Text style={[s.historyCardSub, { color: colors.inkFaint }]}>
                        {new Date(rec.saved_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })} · {rec.subjects.length} subject{rec.subjects.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={[s.historyGwa, { color: h.color }]}>{rec.gwa.toFixed(4)}</Text>
                      <Text style={[type.caption, { color: h.color, fontSize: 10 }]}>{rec.honors}</Text>
                    </View>
                    <Pressable onPress={() => handleDeleteRecord(rec.id)} hitSlop={10} style={{ paddingLeft: spacing.xs }}>
                      <Ionicons name="trash-outline" size={16} color={colors.inkFaint} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* ── Grade Picker Sheet ── */}
      <GradePickerSheet
        visible={activeGradePicker !== null}
        onSelect={handleGradeSelect}
        onClose={() => setActiveGradePicker(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  // Header
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
  headerTitle: { ...type.h2, color: colors.ink, textAlign: 'center' },
  headerSub: { ...type.caption, color: colors.inkFaint, textAlign: 'center', marginTop: 1 },
  resetText: { ...type.caption, color: colors.error, fontWeight: '700' },

  // Result card
  resultCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.paperRaised,
    paddingVertical: spacing.lg + 4, alignItems: 'center',
    ...shadows.soft,
  },
  gwaValue: { fontFamily: 'System', fontSize: 52, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  honorsLabel: { ...type.label, fontSize: 16, marginTop: 2, color: colors.ink },
  subjectsUsed: { ...type.caption, color: colors.inkFaint, marginTop: 4 },
  gwaPlaceholder: { fontSize: 52, fontWeight: '800', color: colors.border, letterSpacing: -1 },
  gwaHint: { ...type.caption, color: colors.inkFaint, marginTop: 4 },

  // Scale strip
  scaleRow: { marginTop: spacing.md, flexGrow: 0 },
  scaleChip: {
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 5,
    alignItems: 'center',
  },
  scaleChipLabel: { ...type.caption, fontWeight: '700', fontSize: 11 },
  scaleChipRange: { ...type.caption, fontSize: 10, marginTop: 1 },

  // Column headers
  colHeaders: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs,
  },
  colHeader: { ...type.overline, color: colors.inkFaint, fontSize: 10 },

  // List
  listContent: { paddingHorizontal: spacing.md },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
    marginTop: spacing.xs, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.periwinkle,
    borderStyle: 'dashed', backgroundColor: colors.periwinkleSoft,
    marginBottom: spacing.md,
  },
  addBtnText: { ...type.label, color: colors.periwinkle, fontSize: 14 },

  // Title bar
  titleBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.paperRaised,
  },
  titleInput: {
    flex: 1, ...type.label, color: colors.ink, fontSize: 14,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    backgroundColor: colors.paper,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.sage, borderRadius: radius.md,
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
  },
  saveBtnText: { ...type.label, color: colors.paper, fontSize: 13 },

  // History
  historyTitle: { ...type.overline, color: colors.inkFaint, marginBottom: spacing.sm },
  historyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 4, padding: spacing.md,
    marginBottom: spacing.xs, gap: spacing.sm,
    ...shadows.soft,
  },
  historyCardTitle: { ...type.label, color: colors.ink, fontSize: 14 },
  historyCardSub: { ...type.caption, marginTop: 1 },
  historyGwa: { fontWeight: '800', fontSize: 17, letterSpacing: -0.5 },
});
