import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

interface FeedbackItem {
  id: string;
  studentName: string;
  category: 'bug' | 'feature' | 'praise';
  title: string;
  comment: string;
  status: 'pending' | 'resolved';
  date: string;
  rating: number;
}

const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    studentName: 'Maria Clara Santos',
    category: 'feature',
    title: 'Dark mode for late night flashcard review',
    comment: 'Would love to have an OLED black mode when studying in bed without straining my eyes!',
    status: 'pending',
    date: '2 hours ago',
    rating: 5,
  },
  {
    id: 'fb-2',
    studentName: 'Juan Dela Cruz',
    category: 'bug',
    title: 'GWA Calculator decimal rounding issue',
    comment: 'When entering 1.75 grades with 3 units, the total sometimes rounds down to 1.74.',
    status: 'pending',
    date: '1 day ago',
    rating: 4,
  },
  {
    id: 'fb-3',
    studentName: 'Sophia Bautista',
    category: 'praise',
    title: 'Gemini Notes Scanner is a lifesaver!',
    comment: 'Created a 30-card anatomy reviewer from a whiteboard photo in 10 seconds. Amazing app!',
    status: 'resolved',
    date: '3 days ago',
    rating: 5,
  },
];

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const handleToggleResolve = (item: FeedbackItem) => {
    const nextStatus = item.status === 'pending' ? 'resolved' : 'pending';
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: nextStatus } : f))
    );
    Alert.alert(
      'Status Updated',
      `Feedback marked as ${nextStatus === 'resolved' ? 'Resolved' : 'Pending'}.`
    );
  };

  const filtered = feedbacks.filter((f) => {
    if (filter === 'pending') return f.status === 'pending';
    if (filter === 'resolved') return f.status === 'resolved';
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STUDENT VOICE</Text>
        <Text style={styles.title}>Feedback & Bug Reports</Text>
        <Text style={styles.subtitle}>
          Direct feedback, feature suggestions, and app ratings from students.
        </Text>

        <View style={styles.filterRow}>
          {(['all', 'pending', 'resolved'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            >
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {f === 'pending'
                  ? `Pending (${feedbacks.filter((x) => x.status === 'pending').length})`
                  : f === 'resolved'
                  ? 'Resolved'
                  : 'All Feedback'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.categoryTag,
                  item.category === 'bug'
                    ? { backgroundColor: colors.errorSoft }
                    : item.category === 'feature'
                    ? { backgroundColor: colors.periwinkleSoft }
                    : { backgroundColor: colors.marigoldSoft },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    item.category === 'bug'
                      ? { color: colors.error }
                      : item.category === 'feature'
                      ? { color: colors.periwinkle }
                      : { color: colors.marigoldInk },
                  ]}
                >
                  {item.category.toUpperCase()}
                </Text>
              </View>

              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < item.rating ? 'star' : 'star-outline'}
                    size={12}
                    color={colors.marigold}
                  />
                ))}
              </View>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>

            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemComment}>{item.comment}</Text>
            <Text style={styles.authorText}>Submitted by: {item.studentName}</Text>

            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.resolveBtn,
                  item.status === 'resolved' && styles.resolvedActiveBtn,
                ]}
                onPress={() => handleToggleResolve(item)}
              >
                <Ionicons
                  name={
                    item.status === 'resolved'
                      ? 'checkmark-circle'
                      : 'checkmark-circle-outline'
                  }
                  size={16}
                  color={item.status === 'resolved' ? colors.sage : colors.inkSoft}
                />
                <Text
                  style={[
                    styles.resolveBtnText,
                    item.status === 'resolved' && { color: colors.sage, fontWeight: '700' },
                  ]}
                >
                  {item.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.inkFaint} />
            <Text style={styles.emptyText}>No feedback found in this tab.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    backgroundColor: colors.paperRaised,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
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
    marginBottom: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  filterBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterBtnText: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  filterBtnTextActive: {
    color: colors.paper,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dateText: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkFaint,
    marginLeft: 'auto',
  },
  itemTitle: {
    ...type.label,
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
  },
  itemComment: {
    ...type.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  authorText: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
    flexDirection: 'row',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resolvedActiveBtn: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sage,
  },
  resolveBtnText: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    ...type.caption,
    color: colors.inkFaint,
  },
});
