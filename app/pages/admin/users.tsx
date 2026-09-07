import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { Ionicons } from '@expo/vector-icons';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'moderator';
  status: 'active' | 'suspended';
  created_at: string;
  decks_count?: number;
  tasks_count?: number;
}

const INITIAL_MOCK_USERS: UserRecord[] = [
  {
    id: 'u-101',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@student.edu',
    role: 'student',
    status: 'active',
    created_at: '2026-08-15T08:30:00Z',
    decks_count: 5,
    tasks_count: 18,
  },
  {
    id: 'u-102',
    name: 'Maria Clara Santos',
    email: 'maria.santos@student.edu',
    role: 'student',
    status: 'active',
    created_at: '2026-08-18T10:15:00Z',
    decks_count: 8,
    tasks_count: 24,
  },
  {
    id: 'u-103',
    name: 'Admin Desk',
    email: 'admin@iskedyul.app',
    role: 'admin',
    status: 'active',
    created_at: '2026-08-01T00:00:00Z',
    decks_count: 12,
    tasks_count: 45,
  },
  {
    id: 'u-104',
    name: 'Christian Grey',
    email: 'christian.grey@spamdomain.com',
    role: 'student',
    status: 'suspended',
    created_at: '2026-08-20T14:40:00Z',
    decks_count: 1,
    tasks_count: 2,
  },
  {
    id: 'u-105',
    name: 'Sophia Bautista',
    email: 'sophia.b@student.edu',
    role: 'moderator',
    status: 'active',
    created_at: '2026-08-22T09:00:00Z',
    decks_count: 14,
    tasks_count: 32,
  },
];

export default function ManageUsers() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_MOCK_USERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(params.q || '');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'moderator' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(50);
      if (!error && data && data.length > 0) {
        const mapped: UserRecord[] = data.map((u: any, idx: number) => ({
          id: u.id || `u-${idx}`,
          name: u.full_name || u.name || u.username || 'Student User',
          email: u.email || 'No email registered',
          role: u.role || 'student',
          status: u.status || 'active',
          created_at: u.created_at || new Date().toISOString(),
          decks_count: u.decks_count || Math.floor(Math.random() * 8),
          tasks_count: u.tasks_count || Math.floor(Math.random() * 20),
        }));
        setUsers(mapped);
      }
    } catch {
      // Fallback stays with INITIAL_MOCK_USERS
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = (user: UserRecord) => {
    const isSuspending = user.status === 'active';
    Alert.alert(
      isSuspending ? 'Suspend Account' : 'Reactivate Account',
      `Are you sure you want to ${isSuspending ? 'suspend' : 'reactivate'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspending ? 'Suspend' : 'Reactivate',
          style: isSuspending ? 'destructive' : 'default',
          onPress: () => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === user.id
                  ? { ...u, status: isSuspending ? 'suspended' : 'active' }
                  : u
              )
            );
            if (selectedUser?.id === user.id) {
              setSelectedUser((prev) =>
                prev ? { ...prev, status: isSuspending ? 'suspended' : 'active' } : null
              );
            }
            Alert.alert('Updated', `${user.name} has been ${isSuspending ? 'suspended' : 'reactivated'}.`);
          },
        },
      ]
    );
  };

  const handleChangeRole = (user: UserRecord, newRole: 'student' | 'moderator' | 'admin') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
    if (selectedUser?.id === user.id) {
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
    Alert.alert('Role Updated', `${user.name}'s role is now ${newRole.toUpperCase()}.`);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const renderUserItem = ({ item }: { item: UserRecord }) => {
    const isSuspended = item.status === 'suspended';
    return (
      <Pressable
        style={[styles.userCard, isSuspended && styles.userCardSuspended]}
        onPress={() => setSelectedUser(item)}
      >
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarWrap,
              item.role === 'admin'
                ? { backgroundColor: colors.sageSoft }
                : item.role === 'moderator'
                ? { backgroundColor: colors.marigoldSoft }
                : { backgroundColor: colors.periwinkleSoft },
            ]}
          >
            <Ionicons
              name={
                item.role === 'admin'
                  ? 'shield-checkmark'
                  : item.role === 'moderator'
                  ? 'star'
                  : 'school'
              }
              size={20}
              color={
                item.role === 'admin'
                  ? colors.sage
                  : item.role === 'moderator'
                  ? colors.marigoldInk
                  : colors.periwinkle
              }
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name}
              </Text>
              {isSuspended && (
                <View style={styles.suspendedTag}>
                  <Text style={styles.suspendedTagText}>SUSPENDED</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.roleBadge,
                  item.role === 'admin'
                    ? { backgroundColor: colors.sageSoft }
                    : item.role === 'moderator'
                    ? { backgroundColor: colors.marigoldSoft }
                    : { backgroundColor: colors.paperLine },
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    item.role === 'admin'
                      ? { color: colors.sage }
                      : item.role === 'moderator'
                      ? { color: colors.marigoldInk }
                      : { color: colors.inkSoft },
                  ]}
                >
                  {item.role}
                </Text>
              </View>
              <Text style={styles.statCount}>
                📚 {item.decks_count} decks • 📋 {item.tasks_count} tasks
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => handleToggleSuspend(item)}
          style={[styles.actionBtn, isSuspended && styles.actionBtnReactivate]}
        >
          <Ionicons
            name={isSuspended ? 'refresh-circle' : 'ban'}
            size={18}
            color={isSuspended ? colors.sage : colors.error}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.inkFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search students by name or email..."
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>

        {/* Role Pills */}
        <View style={styles.filterPills}>
          {(['all', 'student', 'moderator', 'admin'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoleFilter(r)}
              style={[styles.filterPill, roleFilter === r && styles.filterPillActive]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  roleFilter === r && styles.filterPillTextActive,
                ]}
              >
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* User List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.marigold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={40} color={colors.inkFaint} />
              <Text style={styles.emptyText}>No users match your criteria.</Text>
            </View>
          }
        />
      )}

      {/* User Details & Action Modal */}
      {selectedUser && (
        <Modal
          visible={!!selectedUser}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={styles.modalAvatar}>
                  <Ionicons name="person" size={28} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <Text style={styles.modalEmail}>{selectedUser.email}</Text>
                </View>
                <Pressable onPress={() => setSelectedUser(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.ink} />
                </Pressable>
              </View>

              <View style={styles.modalStatsGrid}>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatNum}>{selectedUser.decks_count}</Text>
                  <Text style={styles.modalStatLabel}>Decks</Text>
                </View>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatNum}>{selectedUser.tasks_count}</Text>
                  <Text style={styles.modalStatLabel}>Tasks</Text>
                </View>
                <View style={styles.modalStatCol}>
                  <Text
                    style={[
                      styles.modalStatNum,
                      { color: selectedUser.status === 'active' ? colors.sage : colors.error },
                    ]}
                  >
                    {selectedUser.status.toUpperCase()}
                  </Text>
                  <Text style={styles.modalStatLabel}>Status</Text>
                </View>
              </View>

              <Text style={styles.actionSectionTitle}>ASSIGN ACCOUNT ROLE</Text>
              <View style={styles.rolePickerRow}>
                {(['student', 'moderator', 'admin'] as const).map((roleOption) => (
                  <Pressable
                    key={roleOption}
                    onPress={() => handleChangeRole(selectedUser, roleOption)}
                    style={[
                      styles.rolePickerBtn,
                      selectedUser.role === roleOption && styles.rolePickerBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rolePickerText,
                        selectedUser.role === roleOption && styles.rolePickerTextActive,
                      ]}
                    >
                      {roleOption.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.actionSectionTitle}>ACCOUNT RESTRICTIONS</Text>
              <Pressable
                style={[
                  styles.suspendBtn,
                  selectedUser.status === 'suspended' && styles.reactivateBtn,
                ]}
                onPress={() => handleToggleSuspend(selectedUser)}
              >
                <Ionicons
                  name={selectedUser.status === 'active' ? 'ban' : 'checkmark-circle'}
                  size={18}
                  color={selectedUser.status === 'active' ? colors.error : colors.sage}
                />
                <Text
                  style={[
                    styles.suspendBtnText,
                    selectedUser.status === 'suspended' && { color: colors.sage },
                  ]}
                >
                  {selectedUser.status === 'active'
                    ? 'Suspend Student Account'
                    : 'Restore & Reactivate Account'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  searchHeader: {
    backgroundColor: colors.paperRaised,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    fontSize: 14,
    color: colors.ink,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterPillText: {
    ...type.caption,
    fontWeight: '600',
    color: colors.inkSoft,
    fontSize: 11,
  },
  filterPillTextActive: {
    color: colors.paper,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paperRaised,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  userCardSuspended: {
    opacity: 0.65,
    backgroundColor: '#FAF5F5',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    ...type.label,
    color: colors.ink,
    fontSize: 15,
    flexShrink: 1,
  },
  suspendedTag: {
    backgroundColor: colors.errorSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suspendedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.error,
  },
  userEmail: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: {
    ...type.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  statCount: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkSoft,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnReactivate: {
    backgroundColor: colors.sageSoft,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyText: {
    ...type.caption,
    color: colors.inkFaint,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 42, 76, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.paperLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalName: {
    ...type.h2,
    color: colors.ink,
    fontSize: 18,
  },
  modalEmail: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-around',
  },
  modalStatCol: {
    alignItems: 'center',
  },
  modalStatNum: {
    ...type.h2,
    color: colors.ink,
    fontSize: 18,
  },
  modalStatLabel: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 2,
    fontSize: 11,
  },
  actionSectionTitle: {
    ...type.caption,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePickerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rolePickerBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  rolePickerText: {
    ...type.caption,
    fontWeight: '700',
    color: colors.inkSoft,
    fontSize: 11,
  },
  rolePickerTextActive: {
    color: colors.paper,
  },
  suspendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  reactivateBtn: {
    backgroundColor: colors.sageSoft,
  },
  suspendBtnText: {
    ...type.label,
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
});
