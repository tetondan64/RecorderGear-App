import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lightbulb, FileText, List, Clipboard, MessageSquare, Zap, Plus } from 'lucide-react-native';
import { SummaryStyle } from '@/types/summary';

interface SummaryDropdownProps {
  visible: boolean;
  onClose: () => void;
  onStyleSelect: (style: SummaryStyle) => void;
  selectedStyleId: string | null;
  onAddNewSummary?: () => void;
}

const SUMMARY_STYLES: SummaryStyle[] = [
  {
    id: 'brief-summary',
    title: 'Brief Summary',
    description: 'Quick overview in 2-3 sentences',
    instructions: 'Quick Overview',
    icon: 'zap'
  },
  {
    id: 'detailed-summary',
    title: 'Detailed Summary',
    description: 'Comprehensive analysis with key insights',
    instructions: 'Detailed Analysis',
    icon: 'file-text'
  },
  {
    id: 'key-points',
    title: 'Key Points',
    description: 'Bulleted list of main topics',
    instructions: 'Key Points',
    icon: 'list'
  },
  {
    id: 'action-items',
    title: 'Action Items',
    description: 'Extract actionable tasks and next steps',
    instructions: 'Action Items',
    icon: 'clipboard'
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Structure as formal meeting minutes',
    instructions: 'Meeting Notes',
    icon: 'message-square'
  }
];

const getIcon = (iconName: string, size: number, color: string) => {
  const iconProps = { size, color, strokeWidth: 1.5 };
  
  switch (iconName) {
    case 'zap':
      return <Zap {...iconProps} />;
    case 'file-text':
      return <FileText {...iconProps} />;
    case 'list':
      return <List {...iconProps} />;
    case 'clipboard':
      return <Clipboard {...iconProps} />;
    case 'message-square':
      return <MessageSquare {...iconProps} />;
    case 'plus':
      return <Plus {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

export default function SummaryDropdown({ 
  visible, 
  onClose, 
  onStyleSelect,
  selectedStyleId,
  onAddNewSummary
}: SummaryDropdownProps) {
  const handleStyleSelect = (style: SummaryStyle) => {
    onStyleSelect(style);
    onClose();
  };

  const handleAddNewSummary = () => {
    if (onAddNewSummary) {
      onAddNewSummary();
    }
    onClose();
  };

  if (!visible) return null;

  return (
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
                <Lightbulb size={18} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.headerTitle}>Summary Styles</Text>
              </View>
            </View>

            {/* Summary Styles List */}
            <FlatList
              data={SUMMARY_STYLES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedStyleId === item.id;
                return (
                  <TouchableOpacity 
                    style={[styles.styleItem, isSelected && styles.selectedStyleItem]}
                    onPress={() => handleStyleSelect(item)}
                  >
                    <View style={styles.styleItemContent}>
                      <View style={styles.styleItemLeft}>
                        <View style={styles.iconContainer}>
                          {getIcon(item.icon, 16, isSelected ? '#f4ad3d' : 'rgba(255, 255, 255, 0.7)')}
                        </View>
                        <View style={styles.styleTextContainer}>
                          <Text style={[styles.styleTitle, isSelected && styles.selectedStyleTitle]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.styleDescription, isSelected && styles.selectedStyleDescription]}>
                            {item.description}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              style={styles.stylesList}
            />

            {/* Add New Summary Option */}
            {onAddNewSummary && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity 
                  style={styles.addNewItem}
                  onPress={handleAddNewSummary}
                >
                  <View style={styles.styleItemContent}>
                    <View style={styles.styleItemLeft}>
                      <View style={styles.iconContainer}>
                        {getIcon('plus', 16, '#f4ad3d')}
                      </View>
                      <View style={styles.styleTextContainer}>
                        <Text style={styles.addNewTitle}>
                          Add New Summary
                        </Text>
                        <Text style={styles.addNewDescription}>
                          Create a custom summary style
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Footer Tip */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Choose a style to generate AI summary</Text>
            </View>
          </BlurView>
        </View>
      </TouchableOpacity>
    </Modal>
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
    maxHeight: 500,
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
  stylesList: {
    maxHeight: 320,
  },
  styleItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedStyleItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
  },
  styleItemContent: {
    width: '100%',
  },
  styleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  styleDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  selectedStyleDescription: {
    color: 'rgba(244, 173, 61, 0.8)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  addNewItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.2)',
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 8,
    backgroundColor: 'rgba(244, 173, 61, 0.05)',
  },
  addNewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4ad3d',
    marginBottom: 2,
  },
  addNewDescription: {
    fontSize: 13,
    color: 'rgba(244, 173, 61, 0.7)',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});