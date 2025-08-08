import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Tag as TagIcon, Plus, Search, Check } from 'lucide-react-native';
import { Tag } from '@/types/tag';
import { RecordingsStore } from '@/data/recordingsStore';

interface TagManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedTagIds: string[]) => void;
  currentTagIds: string[];
  recordingName: string;
}

export default function TagManagerModal({
  visible,
  onClose,
  onSave,
  currentTagIds,
  recordingName,
}: TagManagerModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagError, setNewTagError] = useState<string | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);
  const newTagInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadTags();
      setSelectedTagIds(new Set(currentTagIds));
      setSearchQuery('');
      setShowNewTagInput(false);
      setNewTagName('');
      setNewTagError(null);
    }
  }, [visible, currentTagIds]);

  useEffect(() => {
    if (showNewTagInput) {
      setTimeout(() => {
        newTagInputRef.current?.focus();
      }, 100);
    }
  }, [showNewTagInput]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const allTags = await RecordingsStore.getTags();
      setTags(allTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTagToggle = (tagId: string) => {
    const newSelected = new Set(selectedTagIds);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTagIds(newSelected);
  };

  const handleCreateNewTag = async () => {
    const trimmedName = newTagName.trim();
    
    if (!trimmedName) {
      setNewTagError('Tag name cannot be empty');
      return;
    }

    if (trimmedName.length > 32) {
      setNewTagError('Tag name must be 32 characters or less');
      return;
    }

    try {
      setIsCreatingTag(true);
      setNewTagError(null);
      
      const newTag = await RecordingsStore.createTag(trimmedName);
      
      // Add to local state
      setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Auto-select the new tag
      setSelectedTagIds(prev => new Set([...prev, newTag.id]));
      
      // Reset form
      setNewTagName('');
      setShowNewTagInput(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tag';
      setNewTagError(errorMessage);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSave = () => {
    const selectedIds = Array.from(selectedTagIds);
    onSave(selectedIds);
    onClose();
  };

  const handleCancel = () => {
    setSelectedTagIds(new Set(currentTagIds));
    onClose();
  };

  const hasChanges = () => {
    const currentSet = new Set(currentTagIds);
    const selectedSet = new Set(selectedTagIds);
    
    if (currentSet.size !== selectedSet.size) return true;
    
    for (const id of currentSet) {
      if (!selectedSet.has(id)) return true;
    }
    
    return false;
  };

  const handleTagLongPress = (tag: Tag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.name}"? This will remove it from all recordings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await RecordingsStore.deleteTag(tag.id);
              setTags(prev => prev.filter(t => t.id !== tag.id));
              setSelectedTagIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tag.id);
                return newSet;
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete tag');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
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
                    <TagIcon size={20} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.title}>Manage Tags</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                    accessibilityLabel="Close tag manager"
                  >
                    <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Recording Name */}
                <Text style={styles.recordingName} numberOfLines={2}>
                  {recordingName}
                </Text>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputContainer}>
                    <Search size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                    <TextInput
                      ref={searchInputRef}
                      style={styles.searchInput}
                      placeholder="Search tags..."
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* New Tag Section */}
                {!showNewTagInput ? (
                  <TouchableOpacity 
                    style={styles.newTagButton}
                    onPress={() => setShowNewTagInput(true)}
                    accessibilityLabel="Create new tag"
                  >
                    <Plus size={16} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.newTagText}>New Tag</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.newTagInputContainer}>
                    <TextInput
                      ref={newTagInputRef}
                      style={[styles.newTagInput, newTagError && styles.newTagInputError]}
                      placeholder="Enter tag name"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={newTagName}
                      onChangeText={(text) => {
                        setNewTagName(text);
                        if (newTagError) setNewTagError(null);
                      }}
                      maxLength={32}
                      autoFocus={true}
                    />
                    <View style={styles.newTagActions}>
                      <TouchableOpacity 
                        style={styles.newTagCancelButton}
                        onPress={() => {
                          setShowNewTagInput(false);
                          setNewTagName('');
                          setNewTagError(null);
                        }}
                      >
                        <X size={14} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.newTagCreateButton}
                        onPress={handleCreateNewTag}
                        disabled={isCreatingTag || !newTagName.trim()}
                        accessibilityLabel="Create new tag"
                      >
                        <Check size={14} color="#f4ad3d" strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>
                    {newTagError && (
                      <Text style={styles.newTagError}>{newTagError}</Text>
                    )}
                  </View>
                )}

                {/* Tags List */}
                <View style={styles.tagsListContainer}>
                  {filteredTags.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        {searchQuery ? 'No tags match your search' : 'No tags yet'}
                      </Text>
                      <Text style={styles.emptyStateSubtext}>
                        {searchQuery ? 'Try a different search term' : 'Create your first tag to organize recordings'}
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={filteredTags}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => {
                        const isSelected = selectedTagIds.has(item.id);
                        return (
                          <TouchableOpacity 
                            style={[styles.tagItem, isSelected && styles.selectedTagItem]}
                            onPress={() => handleTagToggle(item.id)}
                            onLongPress={() => handleTagLongPress(item)}
                            accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} tag ${item.name}`}
                          >
                            <View style={styles.tagItemLeft}>
                              <View style={[styles.tagColorDot, { backgroundColor: item.color || '#f4ad3d' }]} />
                              <Text style={[styles.tagName, isSelected && styles.selectedTagName]}>
                                {item.name}
                              </Text>
                            </View>
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                              {isSelected && (
                                <Check size={12} color="#FFFFFF" strokeWidth={2} />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      style={styles.tagsList}
                      maxHeight={300}
                    />
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                    accessibilityLabel="Cancel tag changes"
                  >
                    <BlurView intensity={18} style={styles.cancelButtonBlur}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </BlurView>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSave}
                    disabled={!hasChanges()}
                    accessibilityLabel="Save tags"
                  >
                    <LinearGradient
                      colors={['#f4ad3d', '#e09b2d']}
                      style={[styles.saveButtonGradient, !hasChanges() && styles.disabledButton]}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
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
    justifyContent: 'flex-end',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    marginBottom: 16,
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
  recordingName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  newTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.2)',
    marginBottom: 16,
  },
  newTagText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  newTagInputContainer: {
    marginBottom: 16,
  },
  newTagInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  newTagInputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  newTagActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  newTagCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTagCreateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 173, 61, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTagError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  tagsListContainer: {
    maxHeight: 300,
    marginBottom: 24,
  },
  tagsList: {
    maxHeight: 300,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedTagItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderColor: 'rgba(244, 173, 61, 0.3)',
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#f4ad3d',
    borderColor: '#f4ad3d',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
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