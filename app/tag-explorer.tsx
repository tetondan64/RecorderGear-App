import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Tag as TagIcon, MoveHorizontal as MoreHorizontal, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import NewTagModal from '@/components/NewTagModal';
import RenameModal from '@/components/RenameModal';
import ConfirmModal from '@/components/ConfirmModal';
import SnackBar from '@/components/SnackBar';
import { RecordingsStore } from '@/data/recordingsStore';
import { Tag } from '@/types/tag';

interface TagWithCount extends Tag {
  recordingCount: number;
}

interface TagCardProps {
  tag: TagWithCount;
  onRename: (tag: TagWithCount) => void;
  onDelete: (tag: TagWithCount) => void;
}

function TagCard({ tag, onRename, onDelete }: TagCardProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleMorePress = (e: any) => {
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const formatRecordingCount = (count: number): string => {
    if (count === 0) return 'No recordings';
    if (count === 1) return '1 recording';
    return `${count} recordings`;
  };

  return (
    <View style={styles.tagCardContainer}>
      <TouchableOpacity style={styles.tagCard}>
        <BlurView intensity={18} style={styles.tagCardBlur}>
          <View style={styles.tagCardContent}>
            {/* Tag Info */}
            <View style={styles.tagInfo}>
              <View style={styles.tagIconContainer}>
                <View style={[styles.tagColorDot, { backgroundColor: tag.color || '#f4ad3d' }]} />
                <TagIcon size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
              </View>
              <View style={styles.tagDetails}>
                <Text style={styles.tagName} numberOfLines={1}>
                  {tag.name}
                </Text>
                <Text style={styles.recordingCount}>
                  {formatRecordingCount(tag.recordingCount)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.moreButton} 
              onPress={handleMorePress}
            >
              <MoreHorizontal size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>

      {/* Context Menu */}
      {showContextMenu && (
        <TouchableOpacity 
          style={styles.contextMenuOverlay} 
          onPress={() => setShowContextMenu(false)}
        >
          <View style={styles.contextMenu}>
            <BlurView intensity={40} style={styles.contextMenuBlur}>
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={() => {
                  setShowContextMenu(false);
                  onRename(tag);
                }}
              >
                <Edit3 size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                <Text style={styles.contextMenuText}>Rename</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.contextMenuItem, styles.contextMenuItemLast]}
                onPress={() => {
                  setShowContextMenu(false);
                  onDelete(tag);
                }}
              >
                <Trash2 size={16} color="#EF4444" strokeWidth={1.5} />
                <Text style={[styles.contextMenuText, styles.contextMenuTextDanger]}>Delete</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TagExplorerScreen() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToRename, setTagToRename] = useState<TagWithCount | null>(null);
  const [tagToDelete, setTagToDelete] = useState<TagWithCount | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const tagsWithCounts = await RecordingsStore.getTagsWithCounts();
      setTags(tagsWithCounts);
    } catch (error) {
      console.error('Failed to load tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleCreateTag = async (tagName: string) => {
    try {
      await RecordingsStore.createTag(tagName);
      setShowNewTagModal(false);
      showSnackbar(`Tag "${tagName}" created`);
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleRenameTag = (tag: TagWithCount) => {
    setTagToRename(tag);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!tagToRename) return;
    
    try {
      await RecordingsStore.renameTag(tagToRename.id, newName);
      setShowRenameModal(false);
      setTagToRename(null);
      showSnackbar(`Tag renamed to "${newName}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename tag';
      Alert.alert('Rename Error', message);
    }
  };

  const handleDeleteTag = (tag: TagWithCount) => {
    setTagToDelete(tag);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    
    try {
      await RecordingsStore.deleteTag(tagToDelete.id);
      setShowDeleteModal(false);
      setTagToDelete(null);
      
      if (tagToDelete.recordingCount > 0) {
        showSnackbar(`Tag "${tagToDelete.name}" deleted and removed from ${tagToDelete.recordingCount} recording${tagToDelete.recordingCount !== 1 ? 's' : ''}`);
      } else {
        showSnackbar(`Tag "${tagToDelete.name}" deleted`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete tag');
    }
  };

  const getDeleteModalMessage = (): string => {
    if (!tagToDelete) return '';
    
    if (tagToDelete.recordingCount > 0) {
      return `This tag is used by ${tagToDelete.recordingCount} recording${tagToDelete.recordingCount !== 1 ? 's' : ''}. Remove tag from those items?`;
    }
    
    return `Are you sure you want to delete the tag "${tagToDelete.name}"?`;
  };

  const renderTagCard = ({ item }: { item: TagWithCount }) => (
    <TagCard
      tag={item}
      onRename={handleRenameTag}
      onDelete={handleDeleteTag}
    />
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tags...</Text>
        </View>
      );
    }

    if (tags.length === 0) {
      return (
        <EmptyState
          icon={<TagIcon size={48} color="#f4ad3d" strokeWidth={1.5} />}
          title="No tags yet"
          subtitle="Create your first tag to organize and categorize your recordings"
          buttonText="+ New Tag"
          onButtonPress={() => setShowNewTagModal(true)}
        />
      );
    }

    return (
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={renderTagCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tagsList}
      />
    );
  };

  return (
    <Layout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tag Explorer</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowNewTagModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new tag"
        >
          <Plus size={20} color="#f4ad3d" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* New Tag Modal */}
      <NewTagModal
        visible={showNewTagModal}
        onConfirm={handleCreateTag}
        onCancel={() => setShowNewTagModal(false)}
      />

      {/* Rename Modal */}
      <RenameModal
        visible={showRenameModal}
        currentName={tagToRename?.name || ''}
        onConfirm={handleRenameConfirm}
        onCancel={() => {
          setShowRenameModal(false);
          setTagToRename(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Tag?"
        message={getDeleteModalMessage()}
        confirmText={tagToDelete?.recordingCount ? "Delete & Remove" : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setTagToDelete(null);
        }}
        isDestructive={true}
      />

      {/* Snackbar */}
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onHide={() => setSnackbarVisible(false)}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tagsList: {
    paddingBottom: 20,
  },
  tagCardContainer: {
    marginBottom: 12,
    marginHorizontal: 12,
  },
  tagCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  tagCardBlur: {
    flex: 1,
  },
  tagCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  tagColorDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagDetails: {
    flex: 1,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  recordingCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contextMenu: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contextMenuBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  contextMenuItemLast: {
    borderBottomWidth: 0,
  },
  contextMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  contextMenuTextDanger: {
    color: '#EF4444',
  },
});