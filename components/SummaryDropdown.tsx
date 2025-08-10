
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 120,
    paddingRight: 24,
  },
  dropdownContainer: {
    width: 280,
  },
  dropdown: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    maxHeight: 450,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  addCustomText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  stylesList: {
    maxHeight: 300,
  },
  styleItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedStyleItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
  },
  styleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  styleTextContainer: {
    flex: 1,
  },
  styleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  selectedStyleTitle: {
    color: '#f4ad3d',
  },
  styleSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  selectedStyleSubtitle: {
    color: 'rgba(244, 173, 61, 0.8)',
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
