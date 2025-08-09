import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Folder, CreditCard as Edit3, Trash2, Lock, ChevronDown, ChevronUp, X, Plus } from 'lucide-react-native';
import { Folder as FolderType } from '@/types/folder';
import ConfirmModal from './ConfirmModal';
import RenameModal from './RenameModal';

interface FolderCardProps {
  folder: FolderType;
  subfolderCount: number;
  recordingCount: number;
  onPress: () => void;
  onRename: (folder: FolderType, newName: string) => void;
  onDelete: (folder: FolderType) => void;
  onCreateSubfolder: (folder: FolderType) => void;
  isReadOnlyDueToDepth?: boolean;
  isPending?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function FolderCard({
  folder,
  subfolderCount,
  recordingCount,
  onPress,
  onRename,
  onDelete,
  onCreateSubfolder,
  isReadOnlyDueToDepth = false,
  isPending = false,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand = () => {},
}: FolderCardProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const totalItems = subfolderCount + recordingCount;
  const hasItems = totalItems > 0;

  const formatItemCount = () => {
    if (isPending) return 'Creating...';
    if (totalItems === 0) return 'Empty';
    
    const parts = [];
    if (subfolderCount > 0) {
      parts.push(`${subfolderCount} folder${subfolderCount !== 1 ? 's' : ''}`);
    }
    if (recordingCount > 0) {
      parts.push(`${recordingCount} recording${recordingCount !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleMorePress = (e: any) => {
    e.stopPropagation();
    if (isPending) return; // Disable context menu for pending folders
    setShowContextMenu(true);
  };

  const handleRenameConfirm = (newName: string) => {
    setShowRenameModal(false);
    onRename(folder, newName);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete(folder);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.card, isPending && styles.pendingCard]} 
        onPress={isPending ? undefined : onPress}
        disabled={isPending}
      >
        <BlurView intensity={18} style={styles.cardBlur}>
          <View style={styles.content}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.folderInfo}>
                {hasChildren && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onToggleExpand();
                    }}
                    style={styles.chevronButton}
                  >
                    {isExpanded ? (
                      <ChevronUp size={20} color="#FFFFFF" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={20} color="#FFFFFF" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                )}
                <View style={[styles.folderIconContainer, isPending && styles.pendingIconContainer]}>
                  <Folder size={24} color="#f4ad3d" strokeWidth={1.5} />
                  {isPending && (
                    <View style={styles.pendingIndicator}>
                      <View style={styles.pendingDot} />
                    </View>
                  )}
                </View>
                <View style={styles.folderDetails}>
                  <Text style={[styles.folderName, isPending && styles.pendingText]} numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text style={[styles.itemCount, isPending && styles.pendingSubtext]}>
                    {isPending ? 'Creating...' : formatItemCount()}
                  </Text>
                </View>
              </View>

              {!isPending && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={handleMorePress}
                >
                  <Text style={styles.moreIcon}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>

      {/* Context Menu */}
      {!isPending && (
        <Modal
          visible={showContextMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowContextMenu(false)}
        >
          <View style={styles.contextMenuOverlay}>
            <TouchableOpacity
              style={styles.contextMenuBackdrop}
              activeOpacity={1}
              onPress={() => setShowContextMenu(false)}
            >
              <BlurView
                intensity={20}
                style={[styles.contextMenuBackdropBlur, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}
              />
            </TouchableOpacity>
            <View style={styles.contextMenuWrapper}>
              <View style={styles.contextMenuContainer}>
                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                  <BlurView intensity={20} style={[styles.contextMenuModal, { backgroundColor: 'rgba(0, 0, 0, 0.35)' }]}>                
                    <View style={styles.contextMenuContent}>
                      <View style={styles.contextMenuHeader}>
                        <Text style={styles.contextMenuTitle}>Folder Options</Text>
                        <TouchableOpacity
                          style={styles.contextMenuCloseButton}
                          onPress={() => setShowContextMenu(false)}
                        >
                          <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.contextMenuItem}
                        onPress={() => {
                          setShowContextMenu(false);
                          onCreateSubfolder(folder);
                        }}
                      >
                        <Plus size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                        <Text style={styles.contextMenuText}>Create Subfolder</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.contextMenuItem}
                        onPress={() => {
                          setShowContextMenu(false);
                          setShowRenameModal(true);
                        }}
                      >
                        <Edit3 size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                        <Text style={styles.contextMenuText}>Rename</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.contextMenuItem, styles.contextMenuItemLast]}
                        onPress={() => {
                          setShowContextMenu(false);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={18} color="#EF4444" strokeWidth={1.5} />
                        <Text style={[styles.contextMenuText, styles.contextMenuTextDanger]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Rename Modal */}
      {!isPending && <RenameModal
        visible={showRenameModal}
        currentName={folder.name}
        onConfirm={handleRenameConfirm}
        onCancel={() => setShowRenameModal(false)}
      />}

      {/* Delete Confirmation Modal */}
      {!isPending && <ConfirmModal
        visible={showDeleteModal}
        title="Delete Folder?"
        message={
          hasItems
            ? `This will delete "${folder.name}" and move ${totalItems} item${totalItems !== 1 ? 's' : ''} to the root folder. Are you sure?`
            : `This will permanently delete the empty folder "${folder.name}". Are you sure?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isDestructive={true}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  pendingCard: {
    opacity: 0.7,
    backgroundColor: 'rgba(244, 173, 61, 0.05)',
    borderColor: 'rgba(244, 173, 61, 0.2)',
  },
  cardBlur: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  pendingIconContainer: {
    backgroundColor: 'rgba(244, 173, 61, 0.2)',
  },
  pendingIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 173, 61, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f4ad3d',
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pendingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  itemCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pendingSubtext: {
    color: '#f4ad3d',
    fontWeight: '600',
  },
  itemCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockIconContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '900',
  },
  chevronButton: {
    padding: 4,
    marginRight: 8,
  },
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
  },
  contextMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contextMenuBackdropBlur: {
    flex: 1,
  },
  contextMenuWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  contextMenuContainer: {
    width: '100%',
    maxWidth: 400,
  },
  contextMenuModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  contextMenuContent: {
    padding: 24,
  },
  contextMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  contextMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contextMenuCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  contextMenuItemLast: {
    borderBottomWidth: 0,
  },
  contextMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  contextMenuTextDanger: {
    color: '#EF4444',
  },
});
