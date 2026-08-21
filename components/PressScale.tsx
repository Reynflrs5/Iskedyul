import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';

/**
 * Shared tactile press wrapper — spring-scales down on press-in, back up on
 * release. Used for every button across the deck/study flow so the whole
 * app shares one consistent press feel instead of each screen re-writing
 * the same Animated.spring pair.
 *
 * Usage:
 *   <PressScale style={styles.myButton} onPress={handlePress}>
 *     <Text>Label</Text>
 *   </PressScale>
 */
export default function PressScale({
    onPress,
    disabled,
    style,
    children,
}: {
    onPress?: () => void;
    disabled?: boolean;
    style?: any;
    children: React.ReactNode;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () =>
        !disabled && Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
    const pressOut = () =>
        !disabled && Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

    return (
        <Animated.View style={[{ transform: [{ scale }], minHeight: 48 }, style]}>
            <Pressable
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={disabled}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}