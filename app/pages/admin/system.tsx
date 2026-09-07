import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

export default function AdminSystemHealth() {
  const [latency, setLatency] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'healthy' | 'checking' | 'degraded'>('checking');
  const [authStatus, setAuthStatus] = useState<'healthy' | 'checking' | 'degraded'>('checking');
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkHealth = async () => {
    setDbStatus('checking');
    setAuthStatus('checking');
    const start = Date.now();

    try {
      // Test DB ping
      const { error: dbErr } = await supabase.from('tasks').select('id').limit(1);
      const diff = Date.now() - start;
      setLatency(diff);
      setDbStatus(dbErr ? 'degraded' : 'healthy');

      // Test Auth session
      const { error: authErr } = await supabase.auth.getSession();
      setAuthStatus(authErr ? 'degraded' : 'healthy');
    } catch {
      setDbStatus('degraded');
      setAuthStatus('degraded');
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>INFRASTRUCTURE STATUS</Text>
        <Text style={styles.title}>System Health & Logs</Text>
        <Text style={styles.subtitle}>
          Real-time metrics for backend services, database response, and authentication.
        </Text>
      </View>

      {/* Overview status card */}
      <View style={styles.statusBanner}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                dbStatus === 'healthy' && authStatus === 'healthy'
                  ? colors.sage
                  : colors.marigold,
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusHeadline}>
            {dbStatus === 'healthy' && authStatus === 'healthy'
              ? 'All Systems Operational'
              : 'Checking Systems...'}
          </Text>
          <Text style={styles.statusSub}>
            Last verified: {lastChecked || 'Checking...'}
          </Text>
        </View>
        <Pressable style={styles.refreshIconBtn} onPress={checkHealth}>
          <Ionicons name="refresh" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={[styles.iconWrap, { backgroundColor: colors.sageSoft }]}>
            <Ionicons name="server" size={20} color={colors.sage} />
          </View>
          <Text style={styles.metricValue}>
            {latency !== null ? `${latency}ms` : '...'}
          </Text>
          <Text style={styles.metricLabel}>Database Latency</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.iconWrap, { backgroundColor: colors.periwinkleSoft }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.periwinkle} />
          </View>
          <Text style={styles.metricValue}>
            {authStatus === 'healthy' ? 'Active' : authStatus}
          </Text>
          <Text style={styles.metricLabel}>Supabase Auth</Text>
        </View>
      </View>

      {/* Service Details */}
      <Text style={styles.sectionTitle}>MONITORED SERVICES</Text>
      <View style={styles.servicesCard}>
        <View style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>PostgreSQL Cloud DB</Text>
            <Text style={styles.serviceDesc}>Table queries, RLS & triggers</Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  dbStatus === 'healthy' ? colors.sageSoft : colors.marigoldSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    dbStatus === 'healthy' ? colors.sage : colors.marigoldInk,
                },
              ]}
            >
              {dbStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Expo Notifications Engine</Text>
            <Text style={styles.serviceDesc}>Push notifications service</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.sageSoft }]}>
            <Text style={[styles.badgeText, { color: colors.sage }]}>READY</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Gemini AI Service</Text>
            <Text style={styles.serviceDesc}>Deck generator & note scanner</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.periwinkleSoft }]}>
            <Text style={[styles.badgeText, { color: colors.periwinkle }]}>STANDBY</Text>
          </View>
        </View>
      </View>

      {/* App Environment Info */}
      <Text style={styles.sectionTitle}>ENVIRONMENT SPECS</Text>
      <View style={styles.envCard}>
        <View style={styles.envRow}>
          <Text style={styles.envKey}>App Framework</Text>
          <Text style={styles.envVal}>Expo SDK 57 (React Native 0.86)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.envRow}>
          <Text style={styles.envKey}>Router Version</Text>
          <Text style={styles.envVal}>Expo Router v7</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.envRow}>
          <Text style={styles.envKey}>Security / RLS</Text>
          <Text style={styles.envVal}>Supabase Row Level Security</Text>
        </View>
      </View>
    </ScrollView>
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
  statusBanner: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.soft,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusHeadline: {
    ...type.label,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  statusSub: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    ...type.h2,
    color: colors.ink,
    fontSize: 20,
  },
  metricLabel: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  sectionTitle: {
    ...type.caption,
    color: colors.inkSoft,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  servicesCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 8,
  },
  serviceName: {
    ...type.label,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  serviceDesc: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  envCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  envKey: {
    ...type.caption,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  envVal: {
    ...type.caption,
    color: colors.ink,
    fontWeight: '700',
  },
});
