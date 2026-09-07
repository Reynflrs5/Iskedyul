import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

interface DeckItem {
  id: string;
  title: string;
  author: string;
  cardsCount: number;
  isFeatured: boolean;
  reportsCount: number;
  created_at: string;
}

const INITIAL_DECKS: DeckItem[] = [
  {
    id: 'd-1',
    title: 'Data Structures & Algorithms - Finals Reviewer',
    author: 'Juan Dela Cruz',
    cardsCount: 42,
    isFeatured: true,
    reportsCount: 0,
    created_at: '2026-08-28',
  },
  {
    id: 'd-2',
    title: 'Anatomy & Physiology 101: Skeletal System',
    author: 'Maria Clara Santos',
    cardsCount: 56,
    isFeatured: true,
    reportsCount: 0,
    created_at: '2026-08-25',
  },
  {
    id: 'd-3',
    title: 'Philippine History & Constitution Quizzer',
    author: 'Sophia Bautista',
    cardsCount: 30,
    isFeatured: false,
    reportsCount: 0,
    created_at: '2026-09-01',
  },
  {
    id: 'd-4',
    title: 'Spam Deck / Free Crypto Promo Flashcards',
    author: 'Christian Grey',
    cardsCount: 5,
    isFeatured: false,
    reportsCount: 3,
    created_at: '2026-09-05',
  },
];

export default function AdminContentModeration() {
  const [decks, setDecks] = useState<DeckItem[]>(INITIAL_DECKS);
  const [tab, setTab] = useState<'all' | 'reported' | 'featured'>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCards, setNewTemplateCards] = useState('20');

  const handleToggleFeature = (id: string) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isFeatured: !d.isFeatured } : d))
    );
  };

  const handleDeleteDeck = (deck: DeckItem) => {
    Alert.alert(
      'Delete Community Deck',
      `Permanently remove "${deck.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Deck',
          style: 'destructive',
          onPress: () => {
            setDecks((prev) => prev.filter((d) => d.id !== deck.id));
            Alert.alert('Deck Removed', 'The selected deck has been removed from Iskedyul.');
          },
        },
      ]
    );
  };

  const handleDismissReports = (id: string) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, reportsCount: 0 } : d))
    );
    Alert.alert('Reports Cleared', 'Flagged reports for this deck have been dismissed.');
  };

  const handleAddOfficialTemplate = () => {
    if (!newTemplateTitle.trim()) {
      Alert.alert('Required', 'Please enter a template title.');
      return;
    }
    const newDeck: DeckItem = {
      id: `tmpl-${Date.now()}`,
      title: newTemplateTitle.trim(),
      author: 'Iskedyul Official',
      cardsCount: parseInt(newTemplateCards, 10) || 15,
      isFeatured: true,
      reportsCount: 0,
      created_at: new Date().toISOString().slice(0, 10),
    };
    setDecks([newDeck, ...decks]);
    setShowCreateModal(false);
    setNewTemplateTitle('');
    Alert.alert('Template Published', 'Official study template published for all students!');
  };

  const filteredDecks = decks.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.author.toLowerCase().includes(search.toLowerCase());
    if (tab === 'reported') return matchSearch && d.reportsCount > 0;
    if (tab === 'featured') return matchSearch && d.isFeatured;
    return matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>COMMUNITY CONTENT</Text>
            <Text style={styles.title}>Decks & Templates</Text>
          </View>
          <Pressable
            style={styles.addTemplateBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={16} color={colors.paper} />
            <Text style={styles.addTemplateBtnText}>Official Template</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.inkFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search deck title or author..."
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
          />
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['all', 'featured', 'reported'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'reported' ? `⚠️ Flagged (${decks.filter((d) => d.reportsCount > 0).length})` : t === 'featured' ? '⭐ Featured' : 'All Decks'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredDecks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.deckCard}>
            <View style={styles.deckTopRow}>
              <View style={styles.deckInfo}>
                <View style={styles.badgeLine}>
                  {item.isFeatured && (
                    <View style={styles.featuredTag}>
                      <Ionicons name="star" size={10} color={colors.marigoldInk} />
                      <Text style={styles.featuredTagText}>FEATURED</Text>
                    </View>
                  )}
                  {item.reportsCount > 0 && (
                    <View style={styles.reportedTag}>
                      <Ionicons name="alert-circle" size={10} color={colors.error} />
                      <Text style={styles.reportedTagText}>
                        {item.reportsCount} REPORTS
                      </Text>
                    </View>
                  )}
                  <Text style={styles.deckDate}>{item.created_at}</Text>
                </View>
                <Text style={styles.deckTitle}>{item.title}</Text>
                <Text style={styles.deckSub}>
                  By {item.author} • {item.cardsCount} flashcards
                </Text>
              </View>
            </View>

            <View style={styles.deckActionsRow}>
              <Pressable
                style={[styles.actionBtn, item.isFeatured && styles.actionBtnActiveStar]}
                onPress={() => handleToggleFeature(item.id)}
              >
                <Ionicons
                  name={item.isFeatured ? 'star' : 'star-outline'}
                  size={15}
                  color={item.isFeatured ? colors.marigold : colors.inkSoft}
                />
                <Text
                  style={[
                    styles.actionBtnLabel,
                    item.isFeatured && { color: colors.marigoldInk, fontWeight: '700' },
                  ]}
                >
                  {item.isFeatured ? 'Featured' : 'Feature'}
                </Text>
              </Pressable>

              {item.reportsCount > 0 && (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => handleDismissReports(item.id)}
                >
                  <Ionicons name="checkmark-done" size={15} color={colors.sage} />
                  <Text style={[styles.actionBtnLabel, { color: colors.sage }]}>
                    Dismiss
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.actionBtn, styles.actionBtnDelete]}
                onPress={() => handleDeleteDeck(item)}
              >
                <Ionicons name="trash-outline" size={15} color={colors.error} />
                <Text style={[styles.actionBtnLabel, { color: colors.error }]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="folder-open-outline" size={36} color={colors.inkFaint} />
            <Text style={styles.emptyText}>No decks found in this category.</Text>
          </View>
        }
      />

      {/* Create Official Template Modal */}
      {showCreateModal && (
        <Modal
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Publish Official Template</Text>
              <Text style={styles.modalSub}>
                This study deck will be prominently featured for all students.
              </Text>

              <Text style={styles.inputLabel}>Template Title</Text>
              <TextInput
                value={newTemplateTitle}
                onChangeText={setNewTemplateTitle}
                placeholder="e.g. College Entrance Exam Reviewer"
                placeholderTextColor={colors.inkFaint}
                style={styles.inputField}
              />

              <Text style={styles.inputLabel}>Number of Starter Cards</Text>
              <TextInput
                value={newTemplateCards}
                onChangeText={setNewTemplateCards}
                keyboardType="numeric"
                style={styles.inputField}
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.publishBtn}
                  onPress={handleAddOfficialTemplate}
                >
                  <Text style={styles.publishBtnText}>Publish Template</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    marginTop: 2,
  },
  addTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  addTemplateBtnText: {
    ...type.caption,
    color: colors.paper,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    fontSize: 13,
    color: colors.ink,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tabBtnText: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  tabBtnTextActive: {
    color: colors.paper,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 40,
  },
  deckCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
    gap: 10,
  },
  deckTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deckInfo: {
    flex: 1,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.marigoldSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.marigoldInk,
  },
  reportedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.errorSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.error,
  },
  deckDate: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkFaint,
  },
  deckTitle: {
    ...type.label,
    fontSize: 15,
    color: colors.ink,
  },
  deckSub: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  deckActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnActiveStar: {
    backgroundColor: colors.marigoldSoft,
    borderColor: colors.marigold,
  },
  actionBtnDelete: {
    marginLeft: 'auto',
    backgroundColor: colors.errorSoft,
    borderColor: 'transparent',
  },
  actionBtnLabel: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 42, 76, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.sm,
    ...shadows.soft,
  },
  modalTitle: {
    ...type.h2,
    color: colors.ink,
    fontSize: 18,
  },
  modalSub: {
    ...type.caption,
    color: colors.inkSoft,
  },
  inputLabel: {
    ...type.caption,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  inputField: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.ink,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    ...type.caption,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  publishBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
  },
  publishBtnText: {
    ...type.caption,
    fontWeight: '700',
    color: colors.paper,
  },
});
