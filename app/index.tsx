import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, Pressable, StatusBar, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles, colors, WEEK_DAYS } from './styles/welcome.styles';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // --- Responsive tokens ------------------------------------------------
  // Derived per-render from the live window size (not a one-time snapshot),
  // so this stays correct across phones of any size and on rotation.
  const isSmallPhone = width < 360;
  const isLargePhone = width >= 420;

  const horizontalPadding = clamp(width * 0.08, 20, 40);
  const logoSize = clamp(width * 0.42, 140, 200);
  const maxContentWidth = 460; // keeps things from over-stretching on tablets

  // WEEK_DAYS is Monday-first (M T W T F S S), but Date.getDay() is
  // Sunday-first (0 = Sun ... 6 = Sat). Shifting by +6 and wrapping with
  // %7 re-bases it so Monday = 0, matching our array's index order.
  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

  // --- Entrance choreography ---------------------------------------------
  const heroAnim = useRef(new Animated.Value(0)).current;
  const weekAnim = useRef(WEEK_DAYS.map(() => new Animated.Value(0))).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        55,
        weekAnim.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
          })
        )
      ),
      Animated.timing(bottomAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const pressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  // Notebook rule lines, spaced relative to screen height so density looks
  // right whether it's a small Android phone or a tall iPhone Pro Max.
  const ruleLineGap = clamp(height * 0.045, 28, 40);
  const ruleLineCount = Math.ceil(height / ruleLineGap);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Ambient background: soft color blobs + faint notebook rule lines */}
      <View style={styles.backgroundLayer} pointerEvents="none">
        <View
          style={[
            styles.blob,
            {
              width: width * 0.95,
              height: width * 0.95,
              borderRadius: width * 0.475,
              backgroundColor: colors.periwinkleSoft,
              opacity: 0.55,
              top: -width * 0.45,
              right: -width * 0.35,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              width: width * 0.8,
              height: width * 0.8,
              borderRadius: width * 0.4,
              backgroundColor: colors.marigoldSoft,
              opacity: 0.5,
              bottom: height * 0.12,
              left: -width * 0.4,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              width: width * 0.6,
              height: width * 0.6,
              borderRadius: width * 0.3,
              backgroundColor: colors.sageSoft,
              opacity: 0.4,
              bottom: -width * 0.25,
              right: -width * 0.2,
            },
          ]}
        />
        {Array.from({ length: ruleLineCount }).map((_, i) => (
          <View key={i} style={[styles.ruleLine, { top: i * ruleLineGap, opacity: 0.5 }]} />
        ))}
        <View style={[styles.marginRule, { left: horizontalPadding * 0.55 }]} />
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: horizontalPadding,
            width: '100%',
            maxWidth: maxContentWidth,
            alignSelf: 'center',
          },
        ]}
      >
        {/* Hero — logo dead center */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                { translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoTab,
              {
                width: logoSize,
                height: logoSize,
                transform: [
                  {
                    translateY: logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoTabCorner} />
            <Image source={require('@/assets/images/IskedyulLogo.png')} style={styles.logo} />
          </Animated.View>

          <Text style={styles.eyebrow}>Student Planner</Text>
          <Text style={[styles.appName, { fontSize: isSmallPhone ? 28 : isLargePhone ? 36 : 32 }]}>
            Iskedyul
          </Text>
          <Text style={styles.appTagline}>
            Your classes, tasks, and notes — organized in one place.
          </Text>

          {/* WeekStrip — signature identity element, bars grow in like a
              planner page filling up for the week. */}
          <View style={styles.weekStripRow}>
            {WEEK_DAYS.map((day, i) => {
              const isToday = i === todayIndex;
              return (
                <View key={i} style={styles.weekStripBarTrack}>
                  <Animated.View
                    style={[
                      styles.weekStripBar,
                      {
                        height: weekAnim[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, day.height],
                        }),
                        backgroundColor: isToday ? colors.marigold : colors.periwinkle,
                        opacity: isToday ? 1 : 0.55,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.weekStripLabelRow}>
            {WEEK_DAYS.map((day, i) => {
              const isToday = i === todayIndex;
              return (
                <Text
                  key={i}
                  style={[
                    styles.weekStripLabel,
                    isToday && { color: colors.marigoldInk, fontWeight: '700' },
                  ]}
                >
                  {day.label}
                </Text>
              );
            })}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: bottomAnim,
              transform: [
                { translateY: bottomAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.shadowsCtaWrap, { transform: [{ scale: buttonScale }] }]}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/pages/login')}
              onPressIn={pressIn}
              onPressOut={pressOut}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
          </Animated.View>

          <Pressable onPress={() => router.push('/pages/login')} style={styles.secondaryRow}>
            <Text style={styles.secondaryText}>
              Already have an account? <Text style={styles.secondaryLink}>Sign In</Text>
            </Text>
          </Pressable>

          <Text style={styles.termsText}>
            By continuing, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}