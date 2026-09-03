import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { colors } from '../../styles/welcome.styles';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { supabase } from '../../../utils/supabase';
import { router } from 'expo-router';

export default function AdminLayout() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/pages/login');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.paperRaised,
          },
          headerTintColor: colors.ink,
          drawerActiveBackgroundColor: colors.marigoldSoft,
          drawerActiveTintColor: colors.marigold,
          drawerInactiveTintColor: colors.ink,
          headerRight: () => (
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </Pressable>
          ),
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Admin Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="users"
          options={{
            drawerLabel: 'Manage Users',
            title: 'Manage Users',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
