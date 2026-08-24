import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../app/styles/welcome.styles';

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const widthAnim = useRef(new Animated.Value(48)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isExpanded ? 200 : 48,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or notify here if possible
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { width: widthAnim }]}>
      <Pressable style={styles.iconBtn} onPress={() => setIsExpanded(!isExpanded)}>
        <Ionicons name="timer-outline" size={24} color={isActive ? colors.marigold : colors.inkSoft} />
      </Pressable>
      
      {isExpanded && (
        <View style={styles.controls}>
          <Text style={styles.timeText}>{formatTime()}</Text>
          <Pressable style={styles.actionBtn} onPress={toggleTimer}>
            <Ionicons name={isActive ? "pause" : "play"} size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={resetTimer}>
            <Ionicons name="refresh" size={18} color={colors.ink} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above FAB or BottomNav
    right: 20,
    height: 48,
    backgroundColor: colors.paperRaised,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    overflow: 'hidden',
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginLeft: 4,
    marginRight: 12,
    fontVariant: ['tabular-nums'],
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  }
});
