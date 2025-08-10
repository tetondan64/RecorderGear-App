
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, FileText } from 'lucide-react-native';
import { SummaryStyle } from '@/types/summary';

interface CustomSummaryModalProps {
  visible: boolean;
  onSave: (title: string, subtitle: string, instructions: string) => Promise<void>;
  onClose: () => void;
  editingStyle?: SummaryStyle | null;
}

export default function CustomSummaryModal({
  visible,
  onSave,
  onClose,
  editingStyle = null,
}: CustomSummaryModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [errors, setErrors] = useState<{title?: string; subtitle?: string; instructions?: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      if (editingStyle) {
        setTitle(editingStyle.title);
        setSubtitle(editingStyle.subtitle);
        setInstructions(editingStyle.instructions);
      } else {
        setTitle('');
        setSubtitle('');
        setInstructions('');
      }
      setErrors({});
      setIsSaving(false);
      
      // Focus title input after modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [visible, editingStyle]);

  const validateFields = (): boolean => {
    const newErrors: {title?: string; subtitle?: string; instructions?: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 50) {
      newErrors.title = 'Title is too long (max 50 characters)';
    }
    
    if (!subtitle.trim()) {
      newErrors.subtitle = 'Subtitle is required';
    } else if (subtitle.trim().length > 100) {
      newErrors.subtitle = 'Subtitle is too long (max 100 characters)';
    }
    
    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    } else if (instructions.trim().length < 20) {
      newErrors.instructions = 'Instructions are too short (min 20 characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }
    
    try {
      setIsSaving(true);
      setErrors({});
      
      await onSave(title.trim(), subtitle.trim(), instructions.trim());
      
      // Modal will be closed by parent component on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save summary style';
      setErrors({ instructions: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: 'title' | 'subtitle' | 'instructions', value: string) => {
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'subtitle':
        setSubtitle(value);
        break;
      case 'instructions':
        setInstructions(value);
        break;
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isFormValid = title.trim() && subtitle.trim() && instructions.trim();

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
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <FileText size={20} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.title}>
                      {editingStyle ? 'Edit Summary Style' : 'New Summary Style'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Title Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    ref={titleInputRef}
                    style={[styles.textInput, errors.title && styles.textInputError]}
                    value={title}
                    onChangeText={(text) => handleFieldChange('title', text)}
                    placeholder="e.g., Executive Summary"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    maxLength={50}
                  />
                  {errors.title && (
                    <Text style={styles.errorText}>{errors.title}</Text>
                  )}
                </View>

                {/* Subtitle Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Subtitle</Text>
                  <TextInput
                    style={[styles.textInput, errors.subtitle && styles.textInputError]}
                    value={subtitle}
                    onChangeText={(text) => handleFieldChange('subtitle', text)}
                    placeholder="e.g., Concise overview with key points"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    maxLength={100}
                  />
                  {errors.subtitle && (
                    <Text style={styles.errorText}>{errors.subtitle}</Text>
                  )}
                </View>

                {/* Instructions Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>AI Instructions</Text>
                  <Text style={styles.inputSubLabel}>
                    Tell the AI how to format and structure the summary
                  </Text>
                  <TextInput
                    style={[styles.textArea, errors.instructions && styles.textInputError]}
                    value={instructions}
                    onChangeText={(text) => handleFieldChange('instructions', text)}
                    placeholder="Create a summary with the following structure:&#10;&#10;**MAIN POINTS:**&#10;• [Point 1]&#10;• [Point 2]&#10;&#10;**KEY TAKEAWAYS:**&#10;• [Takeaway 1]"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline={true}
                    textAlignVertical="top"
                  />
                  {errors.instructions && (
                    <Text style={styles.errorText}>{errors.instructions}</Text>
                  )}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={onClose}
                    disabled={isSaving}
                  >
                    <BlurView intensity={18} style={styles.cancelButtonBlur}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </BlurView>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSave}
                    disabled={isSaving || !isFormValid}
                  >
                    <LinearGradient
                      colors={['#f4ad3d', '#e09b2d']}
                      style={[styles.saveButtonGradient, (isSaving || !isFormValid) && styles.disabledButton]}
                    >
                      <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : editingStyle ? 'Update' : 'Create'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    maxWidth: 500,
    maxHeight: '90%',
  },
  modal: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: '100%',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  inputSubLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
    fontStyle: 'italic',
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
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    minHeight: 120,
    textAlignVertical: 'top',
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
    marginTop: 8,
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
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
