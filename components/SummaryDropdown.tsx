
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { FileText, Plus, Check, ChevronDown } from 'lucide-react-native';
import { SummaryStyle } from '@/types/summary';
import { SummaryStylesService } from '@/services/summaryStylesService';
import CustomSummaryModal from './CustomSummaryModal';

interface SummaryDropdownProps {
  visible: boolean;
  onClose: () => void;
  onStyleSelect: (style: SummaryStyle) => void;
  selectedStyleId: string | null;
}

export default function SummaryDropdown({ 
  visible, 
  onClose, 
  onStyleSelect,
  selectedStyleId 
}: SummaryDropdownProps) {
  const [styles, setStyles] = useState<SummaryStyle[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // DEBUG: Add console log to verify component is loading
  console.log('🔍 SummaryDropdown DEBUG - Component rendered with visible:', visible, 'styles loaded:', styles.length);
  console.log('🎨 SummaryDropdown DEBUG - StyleSheet object:', StyleSheet);

  useEffect(() => {
    if (visible) {
      loadStyles();
    }
  }, [visible]);

  const loadStyles = async () => {
    try {
      setLoading(true);
      const allStyles = await SummaryStylesService.getAllSummaryStyles();
      setStyles(allStyles);
    } catch (error) {
      console.error('Failed to load summary styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomStyle = async (title: string, subtitle: string, instructions: string) => {
    try {
      const newStyle = await SummaryStylesService.createSummaryStyle(title, subtitle, instructions);
      setStyles(prev => [...prev, newStyle].sort((a, b) => a.title.localeCompare(b.title)));
      setShowCustomModal(false);
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleStyleSelect = (style: SummaryStyle) => {
    onStyleSelect(style);
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity style={styles.overlay} onPress={onClose}>
          <View style={styles.dropdownContainer}>
            <BlurView intensity={20} style={[styles.dropdown, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <FileText size={18} color="#f4ad3d" strokeWidth={1.5} />
                  <Text style={styles.headerTitle}>Summary Styles</Text>
                </View>
              </View>

              {/* Add Custom Style Button */}
              <TouchableOpacity 
                style={styles.addCustomButton}
                onPress={() => setShowCustomModal(true)}
              >
                <Plus size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.addCustomText}>Add Custom Style</Text>
              </TouchableOpacity>

              {/* Styles List */}
              {styles.length > 0 && (
                <View style={styles.separator} />
              )}
              
              <FlatList
                data={styles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedStyleId === item.id;
                  return (
                    <TouchableOpacity 
                      style={[styles.styleItem, isSelected && styles.selectedStyleItem]}
                      onPress={() => handleStyleSelect(item)}
                    >
                      <View style={styles.styleItemContent}>
                        <View style={styles.styleTextContainer}>
                          <Text style={[styles.styleTitle, isSelected && styles.selectedStyleTitle]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.styleSubtitle, isSelected && styles.selectedStyleSubtitle]}>
                            {item.subtitle}
                          </Text>
                        </View>
                        {isSelected && (
                          <Check size={16} color="#f4ad3d" strokeWidth={2} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.stylesList}
                maxHeight={300}
              />

              {styles.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No summary styles yet</Text>
                  <Text style={styles.emptyStateSubtext}>Create your first custom style</Text>
                </View>
              )}
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Summary Modal */}
      <CustomSummaryModal
        visible={showCustomModal}
        onSave={handleCreateCustomStyle}
        onClose={() => setShowCustomModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContainer: {
    width: '90%',
    maxWidth: 320,
    maxHeight: '80%',
  },
  dropdown: {
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
    // DEBUG: Add temporary bright border to verify new styles are loading
    borderTopWidth: 5,
    borderTopColor: '#FF0000', // Bright red top border - should be very obvious!
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(244, 173, 61, 0.2)',
    backgroundColor: 'rgba(244, 173, 61, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(244, 173, 61, 0.05)',
  },
  addCustomText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f4ad3d',
    letterSpacing: 0.2,
  },
  separator: {
    height: 1.5,
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
  },
  stylesList: {
    maxHeight: 340,
    paddingVertical: 8,
  },
  styleItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  selectedStyleItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
  },
  styleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  styleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  styleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  selectedStyleTitle: {
    color: '#f4ad3d',
    fontWeight: '700',
  },
  styleSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  selectedStyleSubtitle: {
    color: 'rgba(244, 173, 61, 0.9)',
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});
