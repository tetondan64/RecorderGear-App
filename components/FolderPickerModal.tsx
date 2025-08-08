import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Folder, Plus, Check } from 'lucide-react-native';
import { Folder as FolderType } from '@/types/folder';
import { FoldersAdapter } from '@/services/foldersAdapter';

interface FolderPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
  currentFolderId: string | null;
  recordingName: string;
}

export default function FolderPickerModal({
  visible,
  onClose,
  onMove,
  currentFolderId,
  recordingName,
}: FolderPickerModalProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const adapter = FoldersAdapter.getInstance();
  const validTargetFolders = folders.filter(folder => {
    // Only show folders at depth <= 1 as valid targets for recordings
    return !folder.isReadOnlyDueToDepth;
  });
  
  const newFolderInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadFolders();
      setSelectedFolderId(currentFolderId);
      setShowNewFolderInput(false);
      setNewFolderName('');
      setNewFolderError(null);
    }
  }, [visible, currentFolderId]);

  useEffect(() => {
    if (showNewFolderInput) {
      setTimeout(() => {
        newFolderInputRef.current?.focus();
      }, 100);
    }
  }, [showNewFolderInput]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const validTargets = await adapter.getValidMoveTargets();
      setFolders(validTargets);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const handleCreateNewFolder = async () => {
    const trimmedName = newFolderName.trim();
    
    if (!trimmedName) {
      setNewFolderError('Folder name cannot be empty');
      return;
    }

    if (trimmedName.length > 32) {
      setNewFolderError('Folder name must be 32 characters or less');
      return;
    }

    try {
      setIsCreatingFolder(true);
      setNewFolderError(null);
      
      const newFolder = await adapter.create(trimmedName);
      
      // Add to local state
      setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Auto-select the new folder
      setSelectedFolderId(newFolder.id);
      
      // Reset form
      setNewFolderName('');
      setShowNewFolderInput(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      setNewFolderError(errorMessage);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFolderId(currentFolderId);
    onClose();
  };

  const hasChanges = () => {
    return selectedFolderId !== currentFolderId;
  };

  const getCurrentFolderName = () => {
    if (!currentFolderId) return null;
    const folder = folders.find(f => f.id === currentFolderId);
    return folder?.name || null;
  };

  const handleFolderLongPress = (folder: FolderType) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? Recordings in this folder will be moved to "No Folder".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await adapter.remove(folder.id);
              setFolders(prev => prev.filter(f => f.id !== folder.id));
              if (selectedFolderId === folder.id) {
                setSelectedFolderId(null);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete folder');
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
                    <Folder size={20} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.title}>Move to Folder</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                    accessibilityLabel="Close folder picker"
                  >
                    <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Recording Name */}
                <Text style={styles.recordingName} numberOfLines={2}>
                  {recordingName}
                </Text>

                {/* Current Folder Display */}
                {getCurrentFolderName() && (
                  <View style={styles.currentFolderContainer}>
                    <Text style={styles.currentFolderLabel}>Currently in:</Text>
                    <Text style={styles.currentFolderName}>{getCurrentFolderName()}</Text>
                  </View>
                )}

                {/* New Folder Section */}
                {!showNewFolderInput ? (
                  <TouchableOpacity 
                    style={styles.newFolderButton}
                    onPress={() => setShowNewFolderInput(true)}
                    accessibilityLabel="Create new folder"
                  >
                    <Plus size={16} color="#f4ad3d" strokeWidth={1.5} />
                    <Text style={styles.newFolderText}>New Folder</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.newFolderInputContainer}>
                    <TextInput
                      ref={newFolderInputRef}
                      style={[styles.newFolderInput, newFolderError && styles.newFolderInputError]}
                      placeholder="Enter folder name"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={newFolderName}
                      onChangeText={(text) => {
                        setNewFolderName(text);
                        if (newFolderError) setNewFolderError(null);
                      }}
                      maxLength={32}
                      autoFocus={true}
                    />
                    <View style={styles.newFolderActions}>
                      <TouchableOpacity 
                        style={styles.newFolderCancelButton}
                        onPress={() => {
                          setShowNewFolderInput(false);
                          setNewFolderName('');
                          setNewFolderError(null);
                        }}
                      >
                        <X size={14} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.newFolderCreateButton}
                        onPress={handleCreateNewFolder}
                        disabled={isCreatingFolder || !newFolderName.trim()}
                        accessibilityLabel="Create new folder"
                      >
                        <Check size={14} color="#f4ad3d" strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>
                    {newFolderError && (
                      <Text style={styles.newFolderError}>{newFolderError}</Text>
                    )}
                  </View>
                )}

                {/* No Folder Option */}
                <TouchableOpacity 
                  style={[styles.folderItem, selectedFolderId === null && styles.selectedFolderItem]}
                  onPress={() => handleFolderSelect(null)}
                  accessibilityLabel="Move to no folder"
                >
                  <View style={styles.folderItemLeft}>
                    <View style={styles.folderIcon}>
                      <Text style={styles.noFolderIcon}>📁</Text>
                    </View>
                    <Text style={[styles.folderName, selectedFolderId === null && styles.selectedFolderName]}>
                      No Folder
                    </Text>
                  </View>
                  <View style={[styles.radioButton, selectedFolderId === null && styles.radioButtonSelected]}>
                    {selectedFolderId === null && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Folders List */}
                {folders.length > 0 && (
                  <View style={styles.separator} />
                )}
                
                <View style={styles.foldersListContainer}>
                  {folders.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No folders yet</Text>
                      <Text style={styles.emptyStateSubtext}>Create your first folder to organize recordings</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={folders}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => {
                        const isSelected = selectedFolderId === item.id;
                        return (
                          <TouchableOpacity 
                            style={[styles.folderItem, isSelected && styles.selectedFolderItem]}
                            onPress={() => handleFolderSelect(item.id)}
                            onLongPress={() => handleFolderLongPress(item)}
                            accessibilityLabel={`Move to folder ${item.name}`}
                          >
                            <View style={styles.folderItemLeft}>
                              <View style={styles.folderIcon}>
                                <Folder size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                              </View>
                              <Text style={[styles.folderName, isSelected && styles.selectedFolderName]}>
                                {item.name}
                              </Text>
                            </View>
                            <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                              {isSelected && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      style={styles.foldersList}
                      maxHeight={200}
                    />
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                    accessibilityLabel="Cancel folder move"
                  >
                    <BlurView intensity={18} style={styles.cancelButtonBlur}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </BlurView>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.moveButton} 
                    onPress={handleMove}
                    disabled={!hasChanges()}
                    accessibilityLabel="Move to folder"
                  >
                    <LinearGradient
                      colors={['#f4ad3d', '#e09b2d']}
                      style={styles.moveButtonGradient}
                    >
                      <Text style={styles.moveButtonText}>Move</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {validTargetFolders.length === 0 && !loading && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No valid destinations</Text>
                    <Text style={styles.emptyStateSubtext}>
                      {folders.length > 0 
                        ? 'All existing folders are too deep for recordings'
                        : 'Create your first folder to organize recordings'
                      }
                    </Text>
                  </View>
                )}
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
  currentFolderContainer: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.2)',
  },
  currentFolderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  currentFolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  newFolderButton: {
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
  newFolderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  newFolderInputContainer: {
    marginBottom: 16,
  },
  newFolderInput: {
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
  newFolderInputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  newFolderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  newFolderCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newFolderCreateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 173, 61, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newFolderError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  foldersListContainer: {
    maxHeight: 200,
    marginBottom: 24,
  },
  foldersList: {
    maxHeight: 200,
  },
  folderItem: {
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
  selectedFolderItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderColor: 'rgba(244, 173, 61, 0.3)',
  },
  folderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  folderIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFolderIcon: {
    fontSize: 14,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  selectedFolderName: {
    color: '#f4ad3d',
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#f4ad3d',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f4ad3d',
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
  moveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  moveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});