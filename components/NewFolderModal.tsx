import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Folder } from 'lucide-react-native';

interface NewFolderModalProps {
  visible: boolean;
  onConfirm: (folderName: string) => Promise<void>;
  onCancel: () => void;
}

export default function NewFolderModal({
  visible,
  onConfirm,
  onCancel,
}: NewFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setFolderName('');
      setError(null);
      setIsCreating(false);
      
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Folder name cannot be empty';
    }
    
    // Check for illegal characters
    const illegalChars = /[<>:"/\\|?*]/g;
    if (illegalChars.test(trimmedName)) {
      return 'Folder name contains invalid characters';
    }
    
    // Check length
    if (trimmedName.length > 50) {
      return 'Folder name is too long (max 50 characters)';
    }
    
    return null;
  };

  const handleConfirm = async () => {
    const validationError = validateName(folderName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      await onConfirm(folderName.trim());
      
      // Modal will be closed by parent component on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTextChange = (text: string) => {
    setFolderName(text);
    if (error) {
      setError(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}>
          <View style={styles.modalContainer}>
            <BlurView intensity={20} style={[styles.modal, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Folder size={20} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.title}>New Folder</Text>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                    <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Input Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Folder name</Text>
                  <TextInput
                    ref={inputRef}
                    style={[styles.textInput, error && styles.textInputError]}
                    value={folderName}
                    onChangeText={handleTextChange}
                    placeholder="Enter folder name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoFocus={true}
                    maxLength={50}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={onCancel}
                    disabled={isCreating}
                  >
                    <BlurView intensity={18} style={styles.cancelButtonBlur}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </BlurView>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmButton} 
                    onPress={handleConfirm}
                    disabled={isCreating || !folderName.trim()}
                  >
                    <LinearGradient
                      colors={['#f4ad3d', '#e09b2d']}
                      style={[styles.confirmButtonGradient, (isCreating || !folderName.trim()) && styles.disabledButton]}
                    >
                      <Text style={styles.confirmButtonText}>
                        {isCreating ? 'Creating...' : 'Create'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderRadius: 20,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textInputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    fontWeight: '500',
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
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});