import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Plus, Chrome as Home, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Layout from '@/components/Layout';
import FolderCard from '@/components/FolderCard';
import FileCard from '@/components/FileCard';
import EmptyState from '@/components/EmptyState';
import NewFolderModal from '@/components/NewFolderModal';
import SnackBar from '@/components/SnackBar';
import { FoldersAdapter } from '@/services/foldersAdapter';
import { AudioFile } from '@/types/audio';
import { Folder } from '@/types/folder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { TranscriptService } from '@/services/transcriptService';

interface FolderWithCounts extends Folder {
  subfolderCount: number;
  recordingCount: number;
}

export default function FileExplorerScreen() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<AudioFile[]>([]);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const adapter = FoldersAdapter.getInstance();
  const { playPause, seekTo, getCurrentTime, isPlaying, stopPlaybackIfPlaying } = useAudioPlayer(recordings);

  useEffect(() => {
    loadFolderContent();
    
    // Debug: Log what we're loading
    console.log('🔍 FileExplorer: Loading content for folderId:', currentFolderId);
  }, [currentFolderId]);

  // Refresh content when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 FileExplorer: Screen focused, refreshing content');
      loadFolderContent();
    }, [currentFolderId])
  );

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = adapter.watch(() => {
      console.log('🔄 FileExplorer: Store changed, refreshing content');
      loadFolderContent();
    });
    
    return unsubscribe;
  }, [currentFolderId, adapter]);

  const loadFolderContent = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 FileExplorer: Starting to load folder content for:', currentFolderId);
      
      // Load folders with counts, recordings, and path for current location
      const [foldersWithCounts, recordingsData, pathData] = await Promise.all([
        adapter.listChildren(currentFolderId),
        adapter.getRecordingsInFolder(currentFolderId),
        adapter.getPath(currentFolderId),
      ]);
      
      console.log('🔍 FileExplorer: Loaded data:', {
        foldersCount: foldersWithCounts.length,
        recordingsCount: recordingsData.length,
        pathLength: pathData.length,
        folders: foldersWithCounts.map(f => ({ id: f.id, name: f.name, parentId: f.parentId }))
      });
      
      setFolders(foldersWithCounts);
      setRecordings(recordingsData);
      setFolderPath(pathData);
    } catch (error) {
      console.error('Failed to load folder content:', error);
      Alert.alert('Error', 'Failed to load folder content');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleFolderPress = (folder: Folder) => {
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbPress = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      await adapter.create(folderName, currentFolderId);
      setShowNewFolderModal(false);
      showSnackbar(`Folder "${folderName}" created`);
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleRenameFolder = async (folder: Folder, newName: string) => {
    try {
      await adapter.rename(folder.id, newName);
      showSnackbar(`Folder renamed to "${newName}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename folder';
      showSnackbar(`Error: ${message}`);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      await adapter.remove(folder.id);
      showSnackbar(`Folder "${folder.name}" deleted`);
    } catch (error) {
      showSnackbar('Error: Failed to delete folder');
    }
  };

  const handleFilePress = (fileId: string) => {
    router.push(`/viewer/${fileId}`);
  };

  const handleDeleteAudio = async (file: AudioFile) => {
    try {
      stopPlaybackIfPlaying(file.id);
      await RecordingsStore.deleteRecording(file.id);
      showSnackbar('Audio file deleted');
    } catch (error) {
      showSnackbar('Error: Failed to delete audio file');
    }
  };

  const handleDeleteTranscription = async (file: AudioFile) => {
    try {
      await TranscriptService.deleteTranscriptByFileId(file.id);
      await RecordingsStore.updateRecordingTranscriptStatus(file.id, false);
      showSnackbar('Transcription deleted');
    } catch (error) {
      showSnackbar('Error: Failed to delete transcription');
    }
  };

  const handleTranscribeFile = async (file: AudioFile) => {
    if (file.hasTranscript) {
      router.push(`/viewer/${file.id}`);
      return;
    }
    
    Alert.alert('Transcribe', `Transcription for ${file.name} would start here`);
  };

  const handleRenameFile = async (file: AudioFile, newName: string) => {
    try {
      await RecordingsStore.renameRecording(file.id, newName);
      showSnackbar(`File renamed to: ${newName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename file';
      showSnackbar(`Error: ${message}`);
    }
  };

  const handleShareFile = (file: AudioFile) => {
    Alert.alert('Share', `Sharing ${file.name}...`);
  };

  const getCurrentFolderName = () => {
    if (!currentFolderId) return 'Root';
    const currentFolder = folderPath[folderPath.length - 1];
    return currentFolder?.name || 'Unknown';
  };

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      { id: null, name: 'Root' },
      ...folderPath
    ];

    return (
      <View style={styles.breadcrumbsContainer}>
        <FlatList
          data={breadcrumbs}
          keyExtractor={(item) => item.id || 'root'}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.breadcrumbItem}>
              <TouchableOpacity
                style={styles.breadcrumbButton}
                onPress={() => handleBreadcrumbPress(item.id)}
              >
                {index === 0 ? (
                  <Home size={16} color="#f4ad3d" strokeWidth={1.5} />
                ) : null}
                <Text style={[
                  styles.breadcrumbText,
                  index === breadcrumbs.length - 1 && styles.breadcrumbTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
              
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={14} color="rgba(255, 255, 255, 0.4)" strokeWidth={1.5} />
              )}
            </View>
          )}
          contentContainerStyle={styles.breadcrumbsList}
        />
      </View>
    );
  };

  const renderContent = () => {
    const hasContent = folders.length > 0 || recordings.length > 0;
    
    if (!hasContent) {
      return (
        <EmptyState
          icon={<Plus size={48} color="#f4ad3d" strokeWidth={1.5} />}
          title="Empty Folder"
          subtitle={`Create a new folder or import audio files to get started`}
          buttonText="+ New Folder"
          onButtonPress={() => setShowNewFolderModal(true)}
        />
      );
    }

    const allItems = [
      ...folders.map(folder => ({ type: 'folder' as const, data: folder })),
      ...recordings.map(recording => ({ type: 'recording' as const, data: recording })),
    ];

    return (
      <FlatList
        data={allItems}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        getItemLayout={(data, index) => {
          // Estimate item heights for virtualization
          const item = data?.[index];
          const height = item?.type === 'folder' ? 100 : 200; // FolderCard ~100px, FileCard ~200px
          return {
            length: height,
            offset: height * index,
            index,
          };
        }}
        renderItem={({ item }) => {
          if (item.type === 'folder') {
            return (
              <FolderCard
                folder={item.data}
                subfolderCount={item.data.subfolderCount}
                recordingCount={item.data.recordingCount}
                onPress={() => handleFolderPress(item.data)}
                onRename={handleRenameFolder}
                onDelete={handleDeleteFolder}
                isReadOnlyDueToDepth={item.data.isReadOnlyDueToDepth}
              />
            );
          } else {
            return (
              <FileCard
                file={item.data}
                onPress={() => handleFilePress(item.data.id)}
                onDeleteAudio={handleDeleteAudio}
                onDeleteTranscription={handleDeleteTranscription}
                onTranscribe={handleTranscribeFile}
                onRename={handleRenameFile}
                onShare={handleShareFile}
                isPlaying={isPlaying(item.data.id)}
                currentTime={getCurrentTime(item.data.id)}
                onPlayPause={(fileId) => playPause(fileId)}
                onSeek={seekTo}
                stopPlaybackIfPlaying={stopPlaybackIfPlaying}
              />
            );
          }
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        contentContainerStyle={styles.contentList}
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
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Explorer</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowNewFolderModal(true)}
        >
          <Plus size={20} color="#f4ad3d" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Content */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          renderContent()
        )}
      </View>

      {/* New Folder Modal */}
      <NewFolderModal
        visible={showNewFolderModal}
        onConfirm={handleCreateFolder}
        onCancel={() => setShowNewFolderModal(false)}
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
    marginBottom: 16,
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
  breadcrumbsContainer: {
    marginBottom: 20,
  },
  breadcrumbsList: {
    paddingHorizontal: 4,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    gap: 6,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: 120,
  },
  breadcrumbTextActive: {
    color: '#f4ad3d',
    fontWeight: '600',
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
  contentList: {
    paddingBottom: 20,
  },
});