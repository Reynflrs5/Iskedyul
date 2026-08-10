import { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { styles, colors } from './styles/welcome.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'plan',
    title: 'Plan smarter',
    subtitle: 'Organize every class, deadline, and task in one clean schedule.',
  },
  {
    key: 'study',
    title: 'Study better',
    subtitle: 'Smart reminders and focus tools keep you on track, every day.',
  },
  {
    key: 'stress',
    title: 'Stress less',
    subtitle: 'See your whole week at a glance — no more last-minute scrambles.',
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(idx);
      },
    }
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Logo + Branding */}
      <View style={styles.brandHeader}>
        <View style={styles.logoTab}>
          <View style={styles.logoTabCorner} />
          <Image
            source={require('@/assets/images/IskedyulLogo.png')}
            style={styles.logo}
          />
        </View>

        <Text style={styles.eyebrow}>Student Planner</Text>

        <Text style={styles.appName}>Iskedyul</Text>
      </View>

      {/* Onboarding Carousel */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={SLIDES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={styles.slideCard}>
              <View style={styles.slideGlyph}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.periwinkle,
                  }}
                />
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />
      </View>

      {/* Pagination */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login')}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
          style={styles.secondaryRow}
        >
          <Text style={styles.secondaryText}>
            Already have an account?{' '}
            <Text style={styles.secondaryLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}