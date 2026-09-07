import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Pressable,
  TextInput,
  Modal,
  RefreshControl,
  Animated,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { Ionicons } from '@expo/vector-icons';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'moderator';
  status: 'active' | 'suspended';
  created_at: string;
  decks_count: number;
  tasks_count: number;
}

type SortKey = 'newest' | 'oldest' | 'name' | 'activity';

const ROLE_META = {
  admin: { color: colors.sage, soft: colors.sageSoft, icon: 'shield-checkmark' as const },
  moderator: { color: colors.marigoldInk, soft: colors.marigoldSoft, icon: 'star' as const },
  student: { color: colors.periwinkle, soft: colors.periwinkleSoft, icon: 'school' as const },
};

const SORT_OPTIONS: { key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'newest', label: 'Newest', icon: 'time-outline' },
  { key: 'oldest', label: 'Oldest', icon: 'hourglass-outline' },
  { key: 'name', label: 'Name A–Z', icon: 'text-outline' },
  { key: 'activity', label: 'Most Active', icon: 'flash-outline' },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulse }]}>
      <View style={styles.skeletonAvatar} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.skeletonLine, { width: '55%' }]} />
        <View style={[styles.skeletonLine, { width: '75%', height: 9 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 9 }]} />
      </View>
    </Animated.View>
  );
}

export default function ManageUsers() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(params.q || '');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'moderator' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userDetailDecks, setUserDetailDecks] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [userDetailTasks, setUserDetailTasks] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [userDetailLoading, setUserDetailLoading] = useState(false);


  const fetchUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    setUserDetailDecks([]);
    setUserDetailTasks([]);
    try {
      const { data, error } = await supabase.rpc('get_user_detail', { p_user_id: userId });
      if (!error && data) {
        setUserDetailDecks(data.decks || []);
        setUserDetailTasks(data.tasks || []);
      }
    } catch (e) {
      // silently fail
    } finally {
      setUserDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        Alert.alert('Database Notice', 'Could not load users from Supabase: ' + profilesError.message);
        setUsers([]);
        return;
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = profilesData.map((p) => p.id);

      // Use SECURITY DEFINER RPC to bypass RLS and get counts for all users
      const { data: activityData } = await supabase.rpc('get_all_user_activity');

      const deckCounts: Record<string, number> = {};
      const taskCounts: Record<string, number> = {};

      (activityData || []).forEach((row: { user_id: string; deck_count: number; task_count: number }) => {
        deckCounts[row.user_id] = Number(row.deck_count) || 0;
        taskCounts[row.user_id] = Number(row.task_count) || 0;
      });

      const mapped: UserRecord[] = profilesData.map((u: any) => {
        const isSuperAdmin =
          u.email && u.email.trim().toLowerCase() === 'jashleyflores0018@gmail.com';
        return {
          id: u.id,
          name: u.full_name || u.name || (isSuperAdmin ? 'Admin Ashley' : 'Student User'),
          email: u.email || 'No email specified',
          role: isSuperAdmin ? 'admin' : (u.role as any) || 'student',
          status: (u.status as any) || 'active',
          created_at: u.created_at || new Date().toISOString(),
          decks_count: deckCounts[u.id] || 0,
          tasks_count: taskCounts[u.id] || 0,
        };
      });

      setUsers(mapped);
    } catch (err: any) {
      console.error('Fetch users failed:', err);
      Alert.alert('Error', err?.message || 'Failed to fetch users from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (user: UserRecord) => {
    const isSuspending = user.status === 'active';
    const newStatus = isSuspending ? 'suspended' : 'active';

    Alert.alert(
      isSuspending ? 'Suspend Account' : 'Reactivate Account',
      `Are you sure you want to ${isSuspending ? 'suspend' : 'reactivate'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspending ? 'Suspend' : 'Reactivate',
          style: isSuspending ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.id);

              if (error) {
                Alert.alert('Update Failed', error.message);
                return;
              }

              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
              );

              if (selectedUser?.id === user.id) {
                setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
              }

              Alert.alert(
                'Success',
                `${user.name} has been ${isSuspending ? 'suspended' : 'reactivated'} in Supabase.`
              );
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (user: UserRecord, newRole: 'student' | 'moderator' | 'admin') => {
    if (user.role === newRole) return;

    const roleLabels: Record<string, string> = {
      student: 'Student',
      moderator: 'Moderator',
      admin: 'Admin',
    };

    Alert.alert(
      'Change Role',
      `Are you sure you want to change ${user.name}'s role from ${roleLabels[user.role]} to ${roleLabels[newRole]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);

              if (error) {
                Alert.alert('Role Update Failed', error.message);
                return;
              }

              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
              );

              if (selectedUser?.id === user.id) {
                setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
              }

              Alert.alert('Role Updated', `${user.name} is now a ${roleLabels[newRole]} in Supabase.`);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };


  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      student: users.filter((u) => u.role === 'student').length,
      moderator: users.filter((u) => u.role === 'moderator').length,
      admin: users.filter((u) => u.role === 'admin').length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    let list = users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'activity':
          return b.decks_count + b.tasks_count - (a.decks_count + a.tasks_count);
        default:
          return 0;
      }
    });

    return list;
  }, [users, search, roleFilter, sortBy]);

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label ?? 'Newest';

  const renderUserItem = ({ item }: { item: UserRecord }) => {
    const isSuspended = item.status === 'suspended';
    const meta = ROLE_META[item.role];
    return (
      <Pressable
        style={({ pressed }) => [
          styles.userCard,
          isSuspended && styles.userCardSuspended,
          pressed && styles.userCardPressed,
        ]}
        onPress={() => {
          setSelectedUser(item);
          fetchUserDetail(item.id);
        }}
      >
        <View style={styles.userInfo}>
          <View style={[styles.avatarWrap, { backgroundColor: meta.soft }]}>
            <Text style={[styles.avatarInitials, { color: meta.color }]}>
              {getInitials(item.name)}
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isSuspended ? colors.error : colors.sage },
              ]}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name={meta.icon} size={12} color={meta.color} />
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>

            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: meta.soft }]}>
                <Text style={[styles.roleText, { color: meta.color }]}>{item.role}</Text>
              </View>
              <Text style={styles.statCount}>
                {item.decks_count} decks · {item.tasks_count} tasks
              </Text>
            </View>
            <Text style={styles.joinedText}>Joined {timeAgo(item.created_at)}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleToggleSuspend(item)}
          hitSlop={8}
          style={[styles.actionBtn, isSuspended && styles.actionBtnReactivate]}
        >
          <Ionicons
            name={isSuspended ? 'refresh' : 'ban-outline'}
            size={17}
            color={isSuspended ? colors.sage : colors.error}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.inkFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search users..."
              placeholderTextColor={colors.inkFaint}
              style={styles.searchInput}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.inkFaint} />
              </Pressable>
            ) : null}
          </View>

          <Pressable style={styles.sortBtn} onPress={() => setSortSheetOpen(true)}>
            <Ionicons name="swap-vertical" size={16} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.sortHint}>
          <Ionicons name="funnel-outline" size={11} color={colors.inkFaint} />
          <Text style={styles.sortHintText}>Sorted by {currentSortLabel}</Text>
        </View>

        {/* Role Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPills}
        >
          {(['all', 'student', 'moderator', 'admin'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoleFilter(r)}
              style={[styles.filterPill, roleFilter === r && styles.filterPillActive]}
            >
              <Text
                style={[styles.filterPillText, roleFilter === r && styles.filterPillTextActive]}
              >
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)} ({roleCounts[r]})
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={44} color={colors.inkFaint} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>
                {search
                  ? 'No accounts match your search filter.'
                  : 'New signups will automatically appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Sort Bottom Sheet */}
      <Modal visible={sortSheetOpen} transparent animationType="fade" onRequestClose={() => setSortSheetOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSortSheetOpen(false)}>
          <Pressable style={styles.sortSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.sortSheetTitle}>Sort Users By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy(opt.key);
                  setSortSheetOpen(false);
                }}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={sortBy === opt.key ? colors.ink : colors.inkSoft}
                />
                <Text
                  style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}
                >
                  {opt.label}
                </Text>
                {sortBy === opt.key && (
                  <Ionicons name="checkmark" size={18} color={colors.ink} style={{ marginLeft: 'auto' }} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

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
                <View
                  style={[
                    styles.modalAvatar,
                    { backgroundColor: ROLE_META[selectedUser.role].soft },
                  ]}
                >
                  <Text
                    style={[styles.modalAvatarText, { color: ROLE_META[selectedUser.role].color }]}
                  >
                    {getInitials(selectedUser.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <Text style={styles.modalEmail}>{selectedUser.email}</Text>
                  <Text style={styles.modalJoined}>
                    Joined {timeAgo(selectedUser.created_at)}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedUser(null)} style={styles.closeBtn} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.ink} />
                </Pressable>
              </View>

              {selectedUser.status === 'suspended' && (
                <View style={styles.suspendedBanner}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={styles.suspendedBannerText}>
                    This account is currently suspended.
                  </Text>
                </View>
              )}

              <View style={styles.modalStatsGrid}>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatNum}>{selectedUser.decks_count}</Text>
                  <Text style={styles.modalStatLabel}>Decks</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatNum}>{selectedUser.tasks_count}</Text>
                  <Text style={styles.modalStatLabel}>Tasks</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStatCol}>
                  <Text
                    style={[
                      styles.modalStatNum,
                      { color: selectedUser.status === 'active' ? colors.sage : colors.error },
                    ]}
                  >
                    {selectedUser.status === 'active' ? 'Active' : 'Suspended'}
                  </Text>
                  <Text style={styles.modalStatLabel}>Status</Text>
                </View>
              </View>

              {/* Decks List */}
              <Text style={styles.actionSectionTitle}>DECKS ({userDetailLoading ? '…' : userDetailDecks.length})</Text>
              {userDetailLoading ? (
                <View style={styles.detailLoadingRow}>
                  <View style={[styles.detailSkeleton, { width: '60%' }]} />
                  <View style={[styles.detailSkeleton, { width: '45%' }]} />
                </View>
              ) : userDetailDecks.length === 0 ? (
                <Text style={styles.detailEmpty}>No decks yet.</Text>
              ) : (
                <ScrollView style={styles.detailList} nestedScrollEnabled>
                  {userDetailDecks.map((deck) => (
                    <View key={deck.id} style={styles.detailItem}>
                      <Ionicons name="layers-outline" size={14} color={colors.periwinkle} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailItemTitle} numberOfLines={1}>{deck.title}</Text>
                        <Text style={styles.detailItemSub}>{timeAgo(deck.created_at)}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Tasks List */}
              <Text style={[styles.actionSectionTitle, { marginTop: 8 }]}>TASKS ({userDetailLoading ? '…' : userDetailTasks.length})</Text>
              {userDetailLoading ? (
                <View style={styles.detailLoadingRow}>
                  <View style={[styles.detailSkeleton, { width: '70%' }]} />
                  <View style={[styles.detailSkeleton, { width: '50%' }]} />
                </View>
              ) : userDetailTasks.length === 0 ? (
                <Text style={styles.detailEmpty}>No tasks yet.</Text>
              ) : (
                <ScrollView style={styles.detailList} nestedScrollEnabled>
                  {userDetailTasks.map((task) => (
                    <View key={task.id} style={styles.detailItem}>
                      <Ionicons name="checkmark-done-outline" size={14} color={colors.sage} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailItemTitle} numberOfLines={1}>{task.title}</Text>
                        <Text style={styles.detailItemSub}>{timeAgo(task.created_at)}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.actionSectionTitle}>ASSIGN ACCOUNT ROLE</Text>
              <View style={styles.rolePickerRow}>
                {(['student', 'moderator', 'admin'] as const).map((roleOption) => {
                  const meta = ROLE_META[roleOption];
                  const active = selectedUser.role === roleOption;
                  return (
                    <Pressable
                      key={roleOption}
                      disabled={actionLoading}
                      onPress={() => handleChangeRole(selectedUser, roleOption)}
                      style={[
                        styles.rolePickerBtn,
                        active && { backgroundColor: meta.color, borderColor: meta.color },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={14}
                        color={active ? colors.paper : colors.inkSoft}
                      />
                      <Text
                        style={[styles.rolePickerText, active && styles.rolePickerTextActive]}
                      >
                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.actionSectionTitle}>ACCOUNT RESTRICTIONS</Text>
              <Pressable
                disabled={actionLoading}
                style={[styles.suspendBtn, selectedUser.status === 'suspended' && styles.reactivateBtn]}
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
                  {selectedUser.status === 'active' ? 'Suspend This User' : 'Reactivate This User'}
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

  // Search & filters
  searchHeader: {
    backgroundColor: colors.paperRaised,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
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
  sortBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortHintText: {
    ...type.caption,
    fontSize: 10,
    color: colors.inkFaint,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingVertical: 6,
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

  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  // Skeleton
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paperRaised,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paperLine,
  },
  skeletonLine: {
    height: 11,
    borderRadius: 4,
    backgroundColor: colors.paperLine,
  },

  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 40,
  },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.paperRaised,
    padding: spacing.md,
    borderRadius: radius.lg ?? radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  userCardPressed: {
    opacity: 0.85,
  },
  userCardSuspended: {
    opacity: 0.65,
    backgroundColor: '#FAF5F5',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.paperRaised,
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
  joinedText: {
    ...type.caption,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 3,
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
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    ...type.label,
    color: colors.ink,
    fontSize: 16,
    marginTop: 6,
  },
  emptyText: {
    ...type.caption,
    color: colors.inkFaint,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 4,
  },

  // Sort sheet
  sortSheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 32,
    gap: 4,
  },
  sortSheetTitle: {
    ...type.h2,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  sortOptionActive: {
    backgroundColor: colors.paperLine,
  },
  sortOptionText: {
    ...type.body,
    fontSize: 14,
    color: colors.inkSoft,
  },
  sortOptionTextActive: {
    color: colors.ink,
    fontWeight: '700',
  },

  // Detail modal
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    fontSize: 18,
    fontWeight: '800',
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
  modalJoined: {
    ...type.caption,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  suspendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.errorSoft,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  suspendedBannerText: {
    ...type.caption,
    color: colors.error,
    fontSize: 11,
    fontWeight: '600',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  modalStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  modalStatNum: {
    ...type.h2,
    color: colors.ink,
    fontSize: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
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

  // User detail lists
  detailList: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailItemTitle: {
    ...type.body,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  detailItemSub: {
    ...type.caption,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 1,
  },
  detailEmpty: {
    ...type.caption,
    color: colors.inkFaint,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
  detailLoadingRow: {
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  detailSkeleton: {
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.paperLine,
  },
});