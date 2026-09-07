import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

export default function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Iskedyul is undergoing routine scheduled maintenance. We will be back online shortly!'
  );
  const [semesterName, setSemesterName] = useState('1st Semester A.Y. 2026-2027');
  const [finalsDate, setFinalsDate] = useState('October 24, 2026');
  const [minAppVersion, setMinAppVersion] = useState('1.1.0');
  const [allowAiScanner, setAllowAiScanner] = useState(true);
  const [allowPublicDecks, setAllowPublicDecks] = useState(true);

  const handleSaveSettings = () => {
    Alert.alert(
      'Settings Saved',
      'Platform configurations and academic term dates have been updated successfully!'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PLATFORM GOVERNANCE</Text>
        <Text style={styles.title}>System Settings</Text>
        <Text style={styles.subtitle}>
          Configure runtime application switches, maintenance locks, and academic terms.
        </Text>
      </View>

      {/* Maintenance Mode Box */}
      <View style={[styles.card, maintenanceMode && styles.cardWarning]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.marigoldSoft }]}>
            <Ionicons name="warning" size={20} color={colors.marigoldInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Emergency Maintenance Mode</Text>
            <Text style={styles.cardDesc}>
              Lock student app access with a maintenance banner.
            </Text>
          </View>
          <Switch
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            trackColor={{ false: colors.paperLine, true: colors.marigold }}
          />
        </View>

        {maintenanceMode && (
          <View style={styles.warningBox}>
            <Text style={styles.warningLabel}>Broadcasted Banner Notice</Text>
            <TextInput
              value={maintenanceMessage}
              onChangeText={setMaintenanceMessage}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </View>
        )}
      </View>

      {/* Academic Term Configuration */}
      <Text style={styles.sectionTitle}>ACADEMIC TERM & SCHEDULE DATES</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Active Term Label</Text>
        <TextInput
          value={semesterName}
          onChangeText={setSemesterName}
          style={styles.input}
        />

        <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>
          Final Exams Countdown Target
        </Text>
        <TextInput
          value={finalsDate}
          onChangeText={setFinalsDate}
          placeholder="e.g. October 24, 2026"
          style={styles.input}
        />
      </View>

      {/* Feature Flags */}
      <Text style={styles.sectionTitle}>GLOBAL FEATURE TOGGLES</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Gemini AI Study Scanner</Text>
            <Text style={styles.toggleDesc}>
              Allow students to generate decks via camera & notes
            </Text>
          </View>
          <Switch
            value={allowAiScanner}
            onValueChange={setAllowAiScanner}
            trackColor={{ false: colors.paperLine, true: colors.sage }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Public Community Decks</Text>
            <Text style={styles.toggleDesc}>
              Enable flashcard sharing between peer students
            </Text>
          </View>
          <Switch
            value={allowPublicDecks}
            onValueChange={setAllowPublicDecks}
            trackColor={{ false: colors.paperLine, true: colors.sage }}
          />
        </View>
      </View>

      {/* Version Control */}
      <Text style={styles.sectionTitle}>APP VERSION ENFORCEMENT</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Minimum Required App Version</Text>
        <TextInput
          value={minAppVersion}
          onChangeText={setMinAppVersion}
          style={styles.input}
        />
        <Text style={styles.helperText}>
          Older app releases will prompt students to download the latest update.
        </Text>
      </View>

      <Pressable style={styles.saveBtn} onPress={handleSaveSettings}>
        <Ionicons name="save-outline" size={18} color={colors.paper} />
        <Text style={styles.saveBtnText}>Save System Configurations</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 50 },
  header: { marginBottom: spacing.xs },
  eyebrow: {
    ...type.caption,
    color: colors.inkFaint,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    ...type.h2,
    color: colors.ink,
    fontSize: 22,
    marginTop: 2,
  },
  subtitle: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardWarning: {
    borderColor: colors.marigold,
    backgroundColor: '#FFFDF9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...type.label,
    fontSize: 15,
    color: colors.ink,
  },
  cardDesc: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  warningBox: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  warningLabel: {
    ...type.caption,
    fontWeight: '700',
    color: colors.marigoldInk,
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.ink,
    textAlignVertical: 'top',
    height: 70,
  },
  sectionTitle: {
    ...type.caption,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...type.caption,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
  },
  helperText: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 6,
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleTitle: {
    ...type.label,
    fontSize: 14,
    color: colors.ink,
  },
  toggleDesc: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  saveBtnText: {
    ...type.label,
    color: colors.paper,
    fontWeight: '700',
    fontSize: 15,
  },
});
