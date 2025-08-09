import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  buttonText,
  onButtonPress
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconContainer}>
          <BlurView intensity={18} style={styles.iconBlur}>
            {icon}
          </BlurView>
        </View>
      )}
      
      <Text style={styles.title}>{title}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <LinearGradient
            colors={['#f4ad3d', '#e09b2d']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
    overflow: 'hidden',
  },
  iconBlur: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(244, 173, 61, 0.2)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 160,
  },
  buttonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});