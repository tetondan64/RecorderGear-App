import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Square, Pause, Settings } from 'lucide-react-native';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPaused(false);
      // Mock timer for demo
      setRecordingTime(47); // Show 0:47 as example
    } else {
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <Layout>
      <Header 
        title="Record" 
        rightIcon={<Settings size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />}
        onRightIconPress={() => {
          // Settings action placeholder
        }}
      />
      
      <View style={styles.recordingContainer}>
        {/* Recording Status */}
        {isRecording && (
          <View style={styles.statusContainer}>
            <BlurView intensity={18} style={styles.statusCard}>
              <View style={styles.recordingIndicator}>
                <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
                <Text style={styles.statusText}>
                  {isPaused ? 'Paused' : 'Recording'}
                </Text>
              </View>
              <Text style={styles.timeText}>{formatTime(recordingTime)}</Text>
            </BlurView>
          </View>
        )}

        {/* Main Recording Button */}
        <View style={styles.micContainer}>
          <TouchableOpacity 
            style={styles.micButton}
            onPress={toggleRecording}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#DC2626'] : ['#60A5FA', '#3B82F6']}
              style={styles.micGradient}
            >
              <BlurView intensity={18} style={styles.micBlur}>
                {isRecording ? (
                  <Square size={40} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <Mic size={40} color="#FFFFFF" strokeWidth={1.5} />
                )}
              </BlurView>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Pulse Animation Ring */}
          {isRecording && !isPaused && (
            <View style={styles.pulseRing} />
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>
            {isRecording ? 'Recording in progress' : 'Tap to Start Recording'}
          </Text>
          <Text style={styles.instructionSubtitle}>
            {isRecording 
              ? 'Speak clearly into your device microphone'
              : 'High-quality audio transcription with AI'
            }
          </Text>
        </View>

        {/* Recording Controls */}
        {isRecording && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={togglePause}
            >
              <BlurView intensity={18} style={styles.controlButtonBlur}>
                {isPaused ? (
                  <Mic size={20} color="#60A5FA" strokeWidth={1.5} />
                ) : (
                  <Pause size={20} color="#60A5FA" strokeWidth={1.5} />
                )}
                <Text style={styles.controlButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingDotPaused: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'transparent',
  },
  instructionsContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  controlButtonBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});