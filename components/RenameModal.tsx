import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';

interface RenameModalProps {
  visible: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameModal({
  visible,
  currentName,
  onConfirm,
  onCancel,
}: RenameModalProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Extract filename without extension
      const nameWithoutExtension = currentName.replace(/\.[^/.]+$/, '');
      setNewName(nameWithoutExtension);
      setError(null);
      
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible, currentName]);

  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'File name cannot be empty';
    }
    
    // Check for illegal characters
    const illegalChars = /[<>:"/\\|?*]/g;
    if (illegalChars.test(trimmedName)) {
      return 'File name contains invalid characters';
    }
    
    // Check length
    if (trimmedName.length > 100) {
      return 'File name is too long (max 100 characters)';
    }
    
    return null;
  };

  const handleConfirm = () => {
    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const sanitizedName = newName.trim().replace(/[<>:"/\\|?*]/g, '_');
    onConfirm(sanitizedName);
  };

  const handleTextChange = (text: string) => {
    setNewName(text);
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
                  <Text style={styles.title}>Rename File</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                    <X size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Input Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New file name</Text>
                  <TextInput
                    ref={inputRef}
                    style={[styles.textInput, error && styles.textInputError]}
                    value={newName}
                    onChangeText={handleTextChange}
                    placeholder="Enter new file name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoFocus={true}
                    selectTextOnFocus={true}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <BlurView intensity={18} style={styles.cancelButtonBlur}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </BlurView>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <LinearGradient
                      colors={['#f4ad3d', '#e09b2d']}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>Rename</Text>
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
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});