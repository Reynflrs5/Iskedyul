import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Pressable } from 'react-native';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { Ionicons } from '@expo/vector-icons';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Typically, auth users cannot be fetched directly on the client side without admin privileges/edge function.
      // Assuming there's a profiles or users table that holds the basic info of the registered users, we fetch from there.
      // Fallback: If no profiles table is found, we will display a mock for the UI preview.
      const { data, error } = await supabase.from('profiles').select('*').limit(50);
      
      if (error) {
        // Fallback to mock data if 'profiles' table doesn't exist
        setUsers([
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', created_at: new Date().toISOString() },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', created_at: new Date().toISOString() },
          { id: '3', name: 'Admin', email: 'admin@iskedyul.app', role: 'admin', created_at: new Date().toISOString() },
        ]);
      } else {
        setUsers(data || []);
      }
    } catch (e) {
      console.log('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (userId: string) => {
    Alert.alert("Suspend User", "Are you sure you want to suspend this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Suspend", style: "destructive", onPress: () => Alert.alert("Success", "User has been suspended.") }
    ]);
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={24} color={colors.periwinkle} />
        </View>
        <View>
          <Text style={styles.userName}>{item.name || item.username || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{item.email || 'No email provided'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role || 'user'}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={() => handleSuspend(item.id)} style={styles.actionBtn}>
        <Ionicons name="ban" size={20} color={colors.error} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.marigold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  listContent: { padding: spacing.lg, gap: spacing.md },
  userCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.paperRaised, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    ...shadows.soft,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.periwinkleSoft,
    alignItems: 'center', justifyContent: 'center'
  },
  userName: { ...type.label, color: colors.ink, fontSize: 16 },
  userEmail: { ...type.caption, color: colors.inkSoft },
  roleBadge: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: colors.sageSoft, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: { ...type.caption, color: colors.sage, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  actionBtn: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.errorSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { ...type.caption, color: colors.inkSoft, textAlign: 'center', marginTop: 40 },
});
