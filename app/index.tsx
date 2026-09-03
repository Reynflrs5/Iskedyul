import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, Pressable, StatusBar, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const logoSize = clamp(width * 0.4, 132, 188);
  const spotlightSize = logoSize * 2.6;
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

      {/* Ambient background: one quiet spotlight behind the hero + faint
          notebook rule lines + the margin rule. No decorative color blobs —
          the spotlight exists to focus attention on the logo, not to fill
          empty space. */}
      <LinearGradient
        colors={[colors.paperWarm, colors.paper]}
        style={styles.backgroundLayer}
        pointerEvents="none"
      >
        <View
          style={[
            styles.spotlight,
            {
              width: spotlightSize,
              height: spotlightSize,
              borderRadius: spotlightSize / 2,
              backgroundColor: colors.marigoldSoft,
              opacity: 0.45,
              top: height * 0.16,
              left: (width - spotlightSize) / 2,
            },
          ]}
        />
        {Array.from({ length: ruleLineCount }).map((_, i) => (
          <View key={i} style={[styles.ruleLine, { top: i * ruleLineGap, opacity: 0.5 }]} />
        ))}
        <View style={[styles.marginRule, { left: horizontalPadding * 0.55 }]} />
      </LinearGradient>

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
        {/* Hero — logo dead center, mounted on a bookmark ribbon */}
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
            style={{
              transform: [
                {
                  translateY: logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
                },
              ],
            }}
          >
            <View style={[styles.ribbon, { height: logoSize * 0.32, left: logoSize / 2 - 17 }]}>
              <View style={styles.ribbonNotchLeft} />
              <View style={styles.ribbonNotchRight} />
            </View>
            <View style={[styles.logoTab, { width: logoSize, height: logoSize }]}>
              <View style={styles.logoTabFold} />
              <Image source={require('@/assets/images/IskedyulLogo.png')} style={styles.logo} />
            </View>
          </Animated.View>

          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Student planner</Text>
          </View>

          <Text style={[styles.appName, { fontSize: isSmallPhone ? 30 : isLargePhone ? 38 : 34 }]}>
            Iskedyul
          </Text>
          <Text style={styles.appTagline}>
            Your classes, tasks, and notes — organized in one place.
          </Text>

          {/* WeekStrip — signature identity element, a small ruled ledger
              where the bars grow in like marks on a page, anchored to a
              baseline, with today marked by a small raised dot. */}
          <View style={styles.weekStripWrap}>
            <View style={styles.weekStripRow}>
              {WEEK_DAYS.map((day, i) => {
                const isToday = i === todayIndex;
                return (
                  <View key={i} style={styles.weekStripBarTrack}>
                    {isToday && <View style={styles.weekStripMarker} />}
                    <Animated.View
                      style={[
                        styles.weekStripBar,
                        {
                          height: weekAnim[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, day.height],
                          }),
                          backgroundColor: isToday ? colors.marigold : colors.periwinkle,
                          opacity: isToday ? 1 : 0.5,
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.weekStripBaseline} />
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
              onPress={() => router.push('/pages/login')}
              onPressIn={pressIn}
              onPressOut={pressOut}
            >
              <LinearGradient
                colors={[colors.ink, colors.inkDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.primaryButton}
              >
                <View style={styles.primaryButtonHighlight} />
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
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