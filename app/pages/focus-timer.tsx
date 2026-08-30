import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, StatusBar, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, type, spacing, radius, shadows } from '../styles/welcome.styles';
import { supabase } from '../../utils/supabase';

// Focus modes
const MODES = {
  POMODORO: { label: 'Pomodoro', minutes: 25, color: colors.sage },
  SHORT_BREAK: { label: 'Short Break', minutes: 5, color: colors.periwinkle },
  LONG_BREAK: { label: 'Long Break', minutes: 15, color: colors.marigold },
};

export default function FocusTimerScreen() {
  const insets = useSafeAreaInsets();
  
  const [activeMode, setActiveMode] = useState<keyof typeof MODES>('POMODORO');
  const [timeLeft, setTimeLeft] = useState(MODES.POMODORO.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      // Pulse animation while running
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ]).start();

    } else if (timeLeft === 0 && isRunning) {
      // Timer finished!
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Update progress bar
  useEffect(() => {
    const totalSeconds = MODES[activeMode].minutes * 60;
    const percentage = (timeLeft / totalSeconds) * 100;
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 500,
      useNativeDriver: false, // width/height interpolation doesn't support native driver well without specific setup
    }).start();
  }, [timeLeft, activeMode]);

  const handleSessionComplete = async () => {
    // If it was a Pomodoro, add XP
    if (activeMode === 'POMODORO') {
      setSessionCount(prev => prev + 1);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Add 20 XP for completing a Pomodoro session
          await supabase.rpc('add_xp', { user_id: user.id, xp_amount: 20 });
        }
      } catch (err) {
        console.error('Error adding XP for focus session', err);
      }
    }
  };

  const switchMode = (mode: keyof typeof MODES) => {
    setActiveMode(mode);
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[activeMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentColor = MODES[activeMode].color;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Focus Timer</Text>
        <View style={{ width: 36 }} /> 
      </View>

      <View style={styles.content}>
        
        {/* Mode Selector */}
        <View style={styles.modeTabs}>
          {(Object.keys(MODES) as Array<keyof typeof MODES>).map((key) => (
            <Pressable
              key={key}
              style={[
                styles.modeTab,
                activeMode === key && { backgroundColor: MODES[key].color }
              ]}
              onPress={() => switchMode(key)}
            >
              <Text style={[
                styles.modeTabText,
                activeMode === key && { color: colors.paper, fontWeight: '700' }
              ]}>
                {MODES[key].label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timer Circle Display */}
        <Animated.View style={[
          styles.timerCircle, 
          { borderColor: currentColor + '40', transform: [{ scale: isRunning ? pulseAnim : 1 }] }
        ]}>
          <Text style={[styles.timeText, { color: currentColor }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={styles.statusText}>
            {isRunning ? 'Focusing...' : 'Paused'}
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[
            styles.progressBar, 
            { 
              backgroundColor: currentColor,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }
          ]} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.resetBtn} onPress={resetTimer}>
            <Ionicons name="refresh" size={24} color={colors.inkSoft} />
          </Pressable>
          
          <Pressable 
            style={[styles.playBtn, { backgroundColor: currentColor }]} 
            onPress={toggleTimer}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={32} color={colors.paper} />
          </Pressable>
          
          <Pressable style={styles.skipBtn} onPress={() => {
            setIsRunning(false);
            setTimeLeft(0);
            handleSessionComplete();
          }}>
            <Ionicons name="play-skip-forward" size={24} color={colors.inkSoft} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Ionicons name="flame" size={24} color={colors.marigold} />
          <View>
            <Text style={styles.statsTitle}>Sessions Completed</Text>
            <Text style={styles.statsValue}>{sessionCount}</Text>
          </View>
        </View>
        <Text style={styles.xpHint}>
          Complete a Pomodoro session to earn 20 XP!
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
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
  headerTitle: { ...type.h2, color: colors.ink },
  
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },

  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  modeTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  modeTabText: {
    ...type.caption,
    color: colors.inkSoft,
    fontWeight: '600',
  },

  timerCircle: {
    width: 250, height: 250,
    borderRadius: 125,
    borderWidth: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paperRaised,
    ...shadows.soft,
    marginBottom: spacing.lg,
  },
  timeText: {
    fontSize: 64,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  statusText: {
    ...type.label,
    color: colors.inkFaint,
    marginTop: spacing.xs,
  },

  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.pill,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xl + 20,
  },
  playBtn: {
    width: 72, height: 72,
    borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.cta,
  },
  resetBtn: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: colors.paperRaised,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  skipBtn: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: colors.paperRaised,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.marigoldSoft,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.marigold + '40',
    gap: spacing.md,
    width: '100%',
  },
  statsTitle: { ...type.caption, color: colors.inkSoft, fontWeight: '700' },
  statsValue: { ...type.h2, color: colors.ink, marginTop: -2 },
  xpHint: {
    ...type.caption,
    color: colors.inkFaint,
    marginTop: spacing.sm,
    textAlign: 'center'
  }
});
