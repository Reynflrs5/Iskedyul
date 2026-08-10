import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/login.styles';
import { styles as welcomeStyles } from '../styles/welcome.styles';
import { supabase } from '../../utils/supabase';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// A focus-animated input: border + background tint fade in on focus instead
// of snapping, using the same "periwinkle glow" language as the rest of the
// app. One Animated.Value drives both properties.
function AnimatedInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () =>
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // borderColor/backgroundColor aren't native-driver props
    }).start();

  const handleBlur = () =>
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.periwinkle],
  });
  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.paperRaised, colors.periwinkleSoft],
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor, backgroundColor }]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8} style={styles.eyeButton}>
            {rightIcon}
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const horizontalPadding = clamp(width * 0.08, 20, 40);
  const maxContentWidth = 460;

  // Responsive logo: scales with available height so it never pushes content off screen
  const availableHeight = height - insets.top - insets.bottom;
  const logoSize = clamp(availableHeight * 0.22, 100, 180);

  // --- Entrance choreography, matching the welcome screen's rhythm -------
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/pages/dashboard');
    }
  };

  const ruleLineGap = clamp(height * 0.045, 28, 40);
  const ruleLineCount = Math.ceil(height / ruleLineGap);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

        {/* Same ambient background language as the welcome screen */}
        <View style={welcomeStyles.backgroundLayer} pointerEvents="none">
          <View
            style={[
              welcomeStyles.blob,
              {
                width: width * 0.9,
                height: width * 0.9,
                borderRadius: width * 0.45,
                backgroundColor: colors.periwinkleSoft,
                opacity: 0.5,
                top: -width * 0.5,
                left: -width * 0.3,
              },
            ]}
          />
          <View
            style={[
              welcomeStyles.blob,
              {
                width: width * 0.7,
                height: width * 0.7,
                borderRadius: width * 0.35,
                backgroundColor: colors.marigoldSoft,
                opacity: 0.45,
                bottom: -width * 0.3,
                right: -width * 0.3,
              },
            ]}
          />
          {Array.from({ length: ruleLineCount }).map((_, i) => (
            <View key={i} style={[welcomeStyles.ruleLine, { top: i * ruleLineGap, opacity: 0.5 }]} />
          ))}
        </View>

        {/* Back button — always pinned to safe area top */}
        <Pressable
          style={[styles.backButton, { top: insets.top + 12, left: horizontalPadding - 8 }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>

        {/* Non-scrollable content — flex column fills the full safe area */}
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + (Platform.OS === 'android' ? 48 : 0),
            paddingBottom: insets.bottom,
            paddingHorizontal: horizontalPadding,
            maxWidth: maxContentWidth,
            width: '100%',
            alignSelf: 'center',
          }}
        >


          {/* Logo — centered, floats gently */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: headerAnim,
                transform: [
                  { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                  { translateY: logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                ],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/IskedyulWelcome.png')}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
            />
          </Animated.View>

          {/* Header text */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: headerAnim,
                transform: [
                  { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                ],
              },
            ]}
          >
            <Text style={styles.eyebrow}>Welcome Back</Text>
            <Text style={styles.title}>Let's sign you in.</Text>
            <Text style={styles.subtitle}>You've been missed!</Text>
          </Animated.View>

          {/* Form — flex:1 so it takes remaining space and pushes sign-up to bottom */}
          <Animated.View
            style={[
              styles.form,
              {
                flex: 1,
                opacity: formAnim,
                transform: [
                  { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                ],
              },
            ]}
          >
            <AnimatedInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AnimatedInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.inkSoft}
                />
              }
              onRightIconPress={() => setShowPassword((v) => !v)}
            />

            <Pressable style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Recover Password</Text>
            </Pressable>

            <Animated.View style={[styles.loginButtonShadowWrap, { transform: [{ scale: buttonScale }] }]}>
              <Pressable
                style={[styles.loginButton, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* OR + Sign up: pushed to bottom on iOS, closer on Android */}
            <View style={{ flex: Platform.OS === 'ios' ? 1 : 0, height: Platform.OS === 'android' ? 16 : 0 }} />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={[styles.signupRow, { marginBottom: 8 }]}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <Pressable onPress={() => router.push('/pages/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}