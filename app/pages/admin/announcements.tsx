import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

export default function AdminAnnouncements() {
  const [title, setTitle] = useState('📣 Iskedyul System Update');
  const [body, setBody] = useState('New study tools and schedule improvements are now live!');
  const [audience, setAudience] = useState<'all' | 'students' | 'admins'>('all');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Please enter both a title and message body.');
      return;
    }

    Alert.alert(
      'Confirm Broadcast',
      `Send push announcement to "${audience.toUpperCase()}" users?\n\n"${title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          style: 'default',
          onPress: async () => {
            setSending(true);
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body,
                  sound: true,
                  data: { audience, timestamp: new Date().toISOString() },
                },
                trigger: null,
              });
              Alert.alert('Success', 'Push announcement delivered successfully!');
              setTitle('');
              setBody('');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to dispatch notification.');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMIN COMMUNICATIONS</Text>
          <Text style={styles.title}>Broadcast Announcement</Text>
          <Text style={styles.subtitle}>
            Instantly dispatch push notifications to students or specific groups.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.pillGroup}>
            {(['all', 'students', 'admins'] as const).map((aud) => (
              <Pressable
                key={aud}
                onPress={() => setAudience(aud)}
                style={[styles.pill, audience === aud && styles.pillActive]}
              >
                <Text style={[styles.pillText, audience === aud && styles.pillTextActive]}>
                  {aud === 'all' ? 'All Users' : aud.charAt(0).toUpperCase() + aud.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Notification Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Midterms Exam Schedule Posted"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Message Content</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write the announcement message here..."
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending}
          >
            <Ionicons name="paper-plane" size={18} color={colors.white} />
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Dispatch Broadcast'}</Text>
          </Pressable>
        </View>

        {/* Live Preview Card */}
        <Text style={styles.previewTitle}>LIVE NOTIFICATION PREVIEW</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.appIconBadge}>
              <Ionicons name="calendar" size={14} color={colors.ink} />
            </View>
            <Text style={styles.appName}>ISKEDYUL</Text>
            <Text style={styles.timeTag}>now</Text>
          </View>
          <Text style={styles.previewNoticeTitle}>{title || 'Notification Title'}</Text>
          <Text style={styles.previewNoticeBody}>
            {body || 'Your notification message preview will display here.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
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
  label: {
    ...type.caption,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pillText: {
    ...type.caption,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  pillTextActive: {
    color: colors.paper,
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
  textArea: {
    height: 100,
  },
  sendBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.sm,
    gap: 8,
  },
  sendBtnText: {
    ...type.label,
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  previewTitle: {
    ...type.caption,
    color: colors.inkFaint,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  previewCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  appIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.marigoldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 0.5,
    flex: 1,
  },
  timeTag: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkFaint,
  },
  previewNoticeTitle: {
    ...type.label,
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  previewNoticeBody: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
    lineHeight: 18,
  },
});
