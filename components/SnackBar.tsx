import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay,
  runOnJS
} from 'react-native-reanimated';

interface SnackBarProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  duration?: number;
}

export default function SnackBar({ 
  visible, 
  message, 
  onHide, 
  duration = 3000 
}: SnackBarProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show animation
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withSpring(1);
      
      // Auto hide after duration
      translateY.value = withDelay(
        duration,
        withSpring(100, { damping: 20, stiffness: 300 }, () => {
          runOnJS(onHide)();
        })
      );
      opacity.value = withDelay(duration, withSpring(0));
    }
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={20} style={styles.snackbar}>
        <Text style={styles.message}>{message}</Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    zIndex: 1000,
  },
  snackbar: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});