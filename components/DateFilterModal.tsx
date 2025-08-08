import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, X, Check } from 'lucide-react-native';
import { DateRange, DatePreset } from '@/types/dateFilter';
import { DateUtils } from '@/utils/dateUtils';

interface DateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (dateRange: DateRange, displayText: string) => void;
  currentRange: DateRange;
}

interface PresetOption {
  id: DatePreset;
  label: string;
  getValue: () => { startDate: number; endDate: number };
}

export default function DateFilterModal({ 
  visible, 
  onClose, 
  onApply,
  currentRange 
}: DateFilterModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetOptions: PresetOption[] = [
    {
      id: 'today',
      label: 'Today',
      getValue: DateUtils.getToday,
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      getValue: DateUtils.getYesterday,
    },
    {
      id: 'last7days',
      label: 'Last 7 Days',
      getValue: DateUtils.getLast7Days,
    },
    {
      id: 'thismonth',
      label: 'This Month',
      getValue: DateUtils.getThisMonth,
    },
  ];

  useEffect(() => {
    if (visible) {
      setError(null);
      setShowCustomPicker(false);
      setSelectedPreset(null);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  }, [visible]);

  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset);
    setShowCustomPicker(false);
    setError(null);
  };

  const handleCustomRangeSelect = () => {
    setSelectedPreset('custom');
    setShowCustomPicker(true);
    setError(null);
    
    // Pre-fill with current date
    const today = new Date().toISOString().split('T')[0];
    setCustomStartDate(today);
    setCustomEndDate(today);
  };

  const validateCustomRange = (): { startDate: number; endDate: number } | null => {
    if (!customStartDate || !customEndDate) {
      setError('Please select both start and end dates');
      return null;
    }

    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (startDate > endDate) {
      setError('Start date must be before or equal to end date');
      return null;
    }

    return {
      startDate: DateUtils.getStartOfDay(startDate),
      endDate: DateUtils.getEndOfDay(endDate),
    };
  };

  const handleApply = () => {
    if (!selectedPreset) {
      setError('Please select a date range');
      return;
    }

    let dateRange: { startDate: number; endDate: number };
    let displayText: string;

    if (selectedPreset === 'custom') {
      const customRange = validateCustomRange();
      if (!customRange) return;
      
      dateRange = customRange;
      displayText = DateUtils.formatDateRange(dateRange.startDate, dateRange.endDate);
    } else {
      const presetOption = presetOptions.find(p => p.id === selectedPreset);
      if (!presetOption) return;
      
      dateRange = presetOption.getValue();
      displayText = presetOption.label;
    }

    onApply(
      {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      displayText
    );
    onClose();
  };

  const handleCancel = () => {
    onClose();
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
                  <View style={styles.headerLeft}>
                    <Calendar size={20} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.title}>Filter by Date</Text>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Preset Options */}
                <View style={styles.presetsContainer}>
                  <Text style={styles.sectionTitle}>Quick Ranges</Text>
                  {presetOptions.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetOption,
                        selectedPreset === preset.id && styles.selectedPresetOption
                      ]}
                      onPress={() => handlePresetSelect(preset.id)}
                    >
                      <Text style={[
                        styles.presetOptionText,
                        selectedPreset === preset.id && styles.selectedPresetOptionText
                      ]}>
                        {preset.label}
                      </Text>
                      {selectedPreset === preset.id && (
                        <Check size={16} color="#f4ad3d" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  {/* Custom Range Option */}
                  <TouchableOpacity
                    style={[
                      styles.presetOption,
                      selectedPreset === 'custom' && styles.selectedPresetOption
                    ]}
                    onPress={handleCustomRangeSelect}
                  >
                    <Text style={[
                      styles.presetOptionText,
                      selectedPreset === 'custom' && styles.selectedPresetOptionText
                    ]}>
                      Custom Range
                    </Text>
                    {selectedPreset === 'custom' && (
                      <Check size={16} color="#f4ad3d" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Custom Date Picker */}
                {showCustomPicker && (
                  <View style={styles.customPickerContainer}>
                    <Text style={styles.sectionTitle}>Select Date Range</Text>
                    
                    <View style={styles.dateInputRow}>
                      <View style={styles.dateInputContainer}>
                        <Text style={styles.dateInputLabel}>Start Date</Text>
                        <TextInput
                          style={styles.dateInput}
                          value={customStartDate}
                          onChangeText={setCustomStartDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        />
                      </View>
                      
                      <View style={styles.dateInputContainer}>
                        <Text style={styles.dateInputLabel}>End Date</Text>
                        <TextInput
                          style={styles.dateInput}
                          value={customEndDate}
                          onChangeText={setCustomEndDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <BlurView intensity={18} style={styles.cancelButtonBlur}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </BlurView>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.applyButton} 
                    onPress={handleApply}
                    disabled={!selectedPreset}
                  >
                    <LinearGradient
                      colors={['#f4ad3d', '#e09b2d']}
                      style={[styles.applyButtonGradient, !selectedPreset && styles.disabledButton]}
                    >
                      <Text style={styles.applyButtonText}>Apply Filter</Text>
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
  presetsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedPresetOption: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderColor: 'rgba(244, 173, 61, 0.3)',
  },
  presetOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedPresetOptionText: {
    color: '#f4ad3d',
    fontWeight: '600',
  },
  customPickerContainer: {
    marginBottom: 20,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
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
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});