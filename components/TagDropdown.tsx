import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Tag as TagIcon, Plus, Check } from 'lucide-react-native';
import { Tag } from '@/types/tag';
import { TagService } from '@/services/tagService';
import NewTagModal from './NewTagModal';

interface TagDropdownProps {
  visible: boolean;
  onClose: () => void;
  onTagsSelect: (tags: Tag[]) => void;
  selectedTagIds: string[];
}

export default function TagDropdown({ 
  visible, 
  onClose, 
  onTagsSelect,
  selectedTagIds 
}: TagDropdownProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTags();
    }
  }, [visible]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const allTags = await TagService.getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (tagName: string) => {
    try {
      const newTag = await TagService.createTag(tagName);
      setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      setShowNewTagModal(false);
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleTagToggle = (tag: Tag) => {
    const isSelected = selectedTagIds.includes(tag.id);
    let newSelectedTags: Tag[];
    
    if (isSelected) {
      // Remove tag
      newSelectedTags = tags.filter(t => 
        selectedTagIds.includes(t.id) && t.id !== tag.id
      );
    } else {
      // Add tag
      newSelectedTags = [
        ...tags.filter(t => selectedTagIds.includes(t.id)),
        tag
      ];
    }
    
    onTagsSelect(newSelectedTags);
  };

  const handleClearAllTags = () => {
    onTagsSelect([]);
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
                  <TagIcon size={18} color="#f4ad3d" strokeWidth={1.5} />
                  <Text style={styles.headerTitle}>Tags</Text>
                </View>
                {selectedTagIds.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearAllButton}
                    onPress={handleClearAllTags}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* New Tag Button */}
              <TouchableOpacity 
                style={styles.newTagButton}
                onPress={() => setShowNewTagModal(true)}
              >
                <Plus size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.newTagText}>New Tag</Text>
              </TouchableOpacity>

              {/* Tags List */}
              {tags.length > 0 && (
                <View style={styles.separator} />
              )}
              
              <FlatList
                data={tags}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedTagIds.includes(item.id);
                  return (
                    <TouchableOpacity 
                      style={[styles.tagItem, isSelected && styles.selectedTagItem]}
                      onPress={() => handleTagToggle(item)}
                    >
                      <View style={styles.tagItemLeft}>
                        <View style={[styles.tagColorDot, { backgroundColor: item.color || '#f4ad3d' }]} />
                        <Text style={[styles.tagName, isSelected && styles.selectedTagName]}>
                          {item.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={16} color="#f4ad3d" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.tagsList}
                maxHeight={200}
              />

              {tags.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tags yet</Text>
                  <Text style={styles.emptyStateSubtext}>Create your first tag to organize recordings</Text>
                </View>
              )}
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Tag Modal */}
      <NewTagModal
        visible={showNewTagModal}
        onConfirm={handleCreateTag}
        onCancel={() => setShowNewTagModal(false)}
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
    width: 240,
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
    maxHeight: 400,
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
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  newTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  newTagText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagsList: {
    maxHeight: 200,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedTagItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
  },
  tagItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tagColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  selectedTagName: {
    color: '#f4ad3d',
    fontWeight: '600',
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