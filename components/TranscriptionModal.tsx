import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Loader as Loader2 } from 'lucide-react-native';

interface TranscriptionModalProps {
  visible: boolean;
  fileName: string;
  progress: number;
  isTranscribing: boolean;
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

export default function TranscriptionModal({
  visible,
  fileName,
  progress,
  isTranscribing,
  error,
  onClose,
  onRetry,
}: TranscriptionModalProps) {
  const getStatusText = () => {
    if (error) return 'Transcription Failed';
    if (isTranscribing) {
      if (progress < 25) return 'Preparing audio...';
      if (progress < 50) return 'Converting file...';
      if (progress < 75) return 'Transcribing with AI...';
      if (progress < 100) return 'Processing results...';
      return 'Finalizing...';
    }
    return 'Transcription Complete!';
  };

  const getStatusColor = () => {
    if (error) return '#EF4444';
    if (progress === 100 && !isTranscribing) return '#10B981';
    return '#f4ad3d';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}>
          <View style={styles.modalContainer}>
            <BlurView intensity={20} style={[styles.modal, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Transcribing Audio</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                    disabled={isTranscribing}
                  >
                    <X size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* File Info */}
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {fileName}
                  </Text>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                  {/* Status Icon */}
                  <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor()}20` }]}>
                    {isTranscribing ? (
                      <Loader2 size={24} color={getStatusColor()} strokeWidth={2} />
                    ) : error ? (
                      <X size={24} color={getStatusColor()} strokeWidth={2} />
                    ) : (
                      <Text style={[styles.checkmark, { color: getStatusColor() }]}>✓</Text>
                    )}
                  </View>

                  {/* Status Text */}
                  <Text style={[styles.statusText, { color: getStatusColor() }]}>
                    {getStatusText()}
                  </Text>

                  {/* Progress Bar */}
                  {isTranscribing && (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View style={styles.progressBackground} />
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{progress}%</Text>
                    </View>
                  )}

                  {/* Error Message */}
                  {error && (
                    <Text style={styles.errorMessage}>{error}</Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  {error && onRetry ? (
                    <>
                      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <BlurView intensity={15} style={styles.cancelButtonBlur}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </BlurView>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                        <LinearGradient
                          colors={['#f4ad3d', '#e09b2d']}
                          style={styles.retryButtonGradient}
                        >
                          <Text style={styles.retryButtonText}>Retry</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.doneButton} 
                      onPress={onClose}
                      disabled={isTranscribing}
                    >
                      <LinearGradient
                        colors={progress === 100 && !isTranscribing ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
                        style={[styles.doneButtonGradient, isTranscribing && styles.disabledButton]}
                      >
                        <Text style={styles.doneButtonText}>
                          {progress === 100 && !isTranscribing ? 'Done' : 'Processing...'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </BlurView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    marginBottom: 24,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 28,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#f4ad3d',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    fontVariant: ['tabular-nums'],
  },
  errorMessage: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButtonBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  retryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});