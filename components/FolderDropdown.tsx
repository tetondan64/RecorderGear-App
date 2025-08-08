import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Folder, Plus, Check } from 'lucide-react-native';
import { Folder as FolderType } from '@/types/folder';
import { FoldersAdapter } from '@/services/foldersAdapter';
import NewFolderModal from './NewFolderModal';

interface FolderDropdownProps {
  visible: boolean;
  onClose: () => void;
  onFolderSelect: (folder: FolderType | null) => void;
  selectedFolderId: string | null;
}

export default function FolderDropdown({ 
  visible, 
  onClose, 
  onFolderSelect,
  selectedFolderId 
}: FolderDropdownProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const adapter = FoldersAdapter.getInstance();

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const allFolders = await adapter.getAllFolders();
      setFolders(allFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      const newFolder = await adapter.create(folderName);
      setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
      setShowNewFolderModal(false);
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleFolderSelect = (folder: FolderType) => {
    onFolderSelect(folder);
    onClose();
  };

  const handleShowAllFiles = () => {
    onFolderSelect(null);
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
                  <Folder size={18} color="#f4ad3d" strokeWidth={1.5} />
                  <Text style={styles.headerTitle}>Folders</Text>
                </View>
              </View>

              {/* New Folder Button */}
              <TouchableOpacity 
                style={styles.newFolderButton}
                onPress={() => setShowNewFolderModal(true)}
              >
                <Plus size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.newFolderText}>New Folder</Text>
              </TouchableOpacity>

              {/* Show All Files Option */}
              <TouchableOpacity 
                style={[styles.folderItem, !selectedFolderId && styles.selectedFolderItem]}
                onPress={handleShowAllFiles}
              >
                <View style={styles.folderItemLeft}>
                  <View style={styles.folderIcon}>
                    <Text style={styles.allFilesIcon}>📁</Text>
                  </View>
                  <Text style={[styles.folderName, !selectedFolderId && styles.selectedFolderName]}>
                    All Files
                  </Text>
                </View>
                {!selectedFolderId && (
                  <Check size={16} color="#f4ad3d" strokeWidth={2} />
                )}
              </TouchableOpacity>

              {/* Folders List */}
              {folders.length > 0 && (
                <View style={styles.separator} />
              )}
              
              <FlatList
                data={folders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.folderItem, selectedFolderId === item.id && styles.selectedFolderItem]}
                    onPress={() => handleFolderSelect(item)}
                  >
                    <View style={styles.folderItemLeft}>
                      <View style={styles.folderIcon}>
                        <Folder size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                      </View>
                      <Text style={[styles.folderName, selectedFolderId === item.id && styles.selectedFolderName]}>
                        {item.name}
                      </Text>
                    </View>
                    {selectedFolderId === item.id && (
                      <Check size={16} color="#f4ad3d" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.foldersList}
                maxHeight={200}
              />

              {folders.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No folders yet</Text>
                  <Text style={styles.emptyStateSubtext}>Create your first folder to organize recordings</Text>
                </View>
              )}
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Folder Modal */}
      <NewFolderModal
        visible={showNewFolderModal}
        onConfirm={handleCreateFolder}
        onCancel={() => setShowNewFolderModal(false)}
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
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  newFolderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  },
  selectedFolderItem: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
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
  allFilesIcon: {
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