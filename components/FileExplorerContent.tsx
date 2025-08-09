import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
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
import { RecordingsStore } from '@/data/recordingsStore';
import { useFolderExplorer } from '@/context/FolderExplorerContext';

interface FileExplorerContentProps {
  recordings: AudioFile[];
  recordingsLoading: boolean;
  pathLoading: boolean;
  currentFolderId: string | null;
  onFolderPress: (folder: Folder) => void;
}

export interface FileExplorerContentHandles {
  openNewFolderModal: () => void;
}

const FileExplorerContent = forwardRef<FileExplorerContentHandles, FileExplorerContentProps>(
  ({
    recordings,
    recordingsLoading,
    pathLoading,
    currentFolderId,
    onFolderPress, // This prop is now handled internally by useFolderExplorer
  },
  ref) => {
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, Folder[]>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    openNewFolderModal: () => {
      setNewFolderParentId(null);
      setShowNewFolderModal(true);
    },
  }));

  const { 
    items: folders,
    loading: foldersLoading,
    error: foldersError,
    refetch: refreshFolders,
    addOptimisticFolder,
    replaceOptimisticFolder,
    removeOptimisticFolder,
  } = useFolderExplorer(); // Consume from context
  
  const { playPause, seekTo, getCurrentTime, isPlaying, stopPlaybackIfPlaying } = useAudioPlayer(recordings);
  const adapter = FoldersAdapter.getInstance();

  const isLoading = foldersLoading || recordingsLoading || pathLoading;

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleCreateSubfolder = (folder: Folder) => {
    setNewFolderParentId(folder.id);
    setShowNewFolderModal(true);
  };

  const handleCreateFolder = useCallback(async (folderName: string, parentId?: string | null) => {
    if (isCreating) {
      console.log('⚠️ FileExplorerContent: Create already in progress, ignoring');
      return;
    }

    const startTime = Date.now();
    let optimisticTempId: string | null = null;
    let optimisticMs = 0;
    let totalMs = 0;
    let success = false;
    let watchdogTimeout: NodeJS.Timeout | null = null;
    let finalWatchdogTimeout: NodeJS.Timeout | null = null;

    try {
      setIsCreating(true);
      
      // Client-side validation
      const trimmedName = folderName.trim();

      if (!trimmedName) {
        throw new Error('Folder name cannot be empty');
      }

      if (trimmedName.length > 32) {
        throw new Error('Folder name must be 32 characters or less');
      }

      // Check for illegal characters
      const illegalChars = /[<>:"/\\|?*]/g;
      if (illegalChars.test(trimmedName)) {
        throw new Error('Folder name contains invalid characters');
      }

      const targetParentId = parentId ?? currentFolderId;

      // Check for duplicates in target parent
      const isDuplicate = await adapter.existsInParent(trimmedName, targetParentId);
      if (isDuplicate) {
        throw new Error('A folder with this name already exists in this location');
      }

      // Check depth limit
      const currentDepth = await adapter.getDepth(targetParentId);
      if (currentDepth >= 2) {
        throw new Error('Cannot create folders deeper than 2 levels');
      }

      if (targetParentId === currentFolderId) {
        // Add optimistic folder
        optimisticTempId = addOptimisticFolder(trimmedName);
        optimisticMs = Date.now() - startTime;

        console.log('optimistic:add', { tempId: optimisticTempId, name: trimmedName, parentId: targetParentId });
      }
      
      // Set up watchdog timers
      watchdogTimeout = setTimeout(() => {
        console.log('⏰ FileExplorerContent: Watchdog refetch triggered for tempId:', optimisticTempId);
        refreshFolders();
      }, 2500);
      
      finalWatchdogTimeout = setTimeout(() => {
        if (optimisticTempId) {
          console.log('⏰ FileExplorerContent: Final watchdog removing stuck folder:', optimisticTempId);
          removeOptimisticFolder(optimisticTempId);
          showSnackbar('Folder creation timed out. Please try again.');
        }
      }, 3500);
      
      // Create the actual folder
      const newFolder = await adapter.create(trimmedName, targetParentId);
      totalMs = Date.now() - startTime;
      success = true;
      
      console.log('events:create', { 
        id: newFolder.id, 
        name: newFolder.name,
        tempId: optimisticTempId 
      });

      // Emit local reconcile event for immediate UI update or refresh children
      if (optimisticTempId) {
        console.log('local:reconcile', { tempId: optimisticTempId, realId: newFolder.id });
        replaceOptimisticFolder(optimisticTempId, {
          ...newFolder,
          subfolderCount: 0,
          recordingCount: 0,
        });
        setTimeout(() => refreshFolders(), 500);
      } else if (targetParentId) {
        const children = await adapter.listChildren(targetParentId);
        setExpandedFolders(prev => ({ ...prev, [targetParentId]: children }));
        setExpandedIds(prev => new Set(prev).add(targetParentId));
        refreshFolders();
      }

      // Clear watchdog timers on success
      if (watchdogTimeout) clearTimeout(watchdogTimeout);
      if (finalWatchdogTimeout) clearTimeout(finalWatchdogTimeout);

      setShowNewFolderModal(false);
      setNewFolderParentId(null);
      showSnackbar(`Folder "${folderName}" created`);
      
    } catch (error) {
      console.error('❌ FileExplorerContent: Folder creation failed:', error);
      
      // Clear watchdog timers on error
      if (watchdogTimeout) clearTimeout(watchdogTimeout);
      if (finalWatchdogTimeout) clearTimeout(finalWatchdogTimeout);
      
      // Remove optimistic folder on error
      if (optimisticTempId) {
        console.log('removeTemp', { tempId: optimisticTempId });
        removeOptimisticFolder(optimisticTempId);
      }
      
      totalMs = Date.now() - startTime;
      
      throw error; // Let the modal handle the error display
    } finally {
      setIsCreating(false);
      
      // Telemetry logging
      console.log('📊 folder_create:', {
        parentId: parentId ?? currentFolderId,
        nameLength: folderName.trim().length,
        optimisticMs,
        totalMs,
        ok: success,
      });
    }
  }, [isCreating, currentFolderId, addOptimisticFolder, refreshFolders, removeOptimisticFolder, adapter]);

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

  const renderContent = () => {
    const hasContent = folders.length > 0 || recordings.length > 0;
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }
    
    if (!hasContent) {
      const isRoot = currentFolderId === null;
      return (
        <EmptyState
          {...(isRoot ? {} : { icon: <Plus size={48} color="#f4ad3d" strokeWidth={1.5} /> })}
          title="Empty Folder"
          subtitle={
            isRoot
              ? 'Open Library to import audio files.'
              : 'Create a new folder or import audio files to get started'
          }
          buttonText="+ New Folder"
          onButtonPress={() => {
            setNewFolderParentId(null);
            setShowNewFolderModal(true);
          }}
        />
      );
    }

    const buildFolderItems = (folderList: Folder[], depth = 0): Array<{ type: 'folder'; data: Folder; depth: number }> => {
      const items: Array<{ type: 'folder'; data: Folder; depth: number }> = [];
      folderList.forEach(f => {
        items.push({ type: 'folder', data: f, depth });
        if (expandedIds.has(f.id)) {
          const children = expandedFolders[f.id] || [];
          items.push(...buildFolderItems(children, depth + 1));
        }
      });
      return items;
    };

    const allItems = [
      ...buildFolderItems(folders),
      ...recordings.map(recording => ({ type: 'recording' as const, data: recording, depth: 0 })),
    ];

    return (
      <FlatList
        data={allItems}
        keyExtractor={(item) => {
          if (item.type === 'folder') {
            // Use tempId for optimistic folders, id for persisted folders
            return `folder-${item.data.tempId || item.data.id}`;
          }
          return `recording-${item.data.id}`;
        }}
        extraData={folders}
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
            const isExpanded = expandedIds.has(item.data.id);
            const hasChildren = item.data.subfolderCount > 0;
            const handleToggle = async () => {
              if (isExpanded) {
                setExpandedIds(prev => {
                  const next = new Set(prev);
                  next.delete(item.data.id);
                  return next;
                });
              } else {
                if (!expandedFolders[item.data.id]) {
                  const children = await adapter.listChildren(item.data.id);
                  setExpandedFolders(prev => ({ ...prev, [item.data.id]: children }));
                }
                setExpandedIds(prev => new Set(prev).add(item.data.id));
              }
            };
            return (
              <View style={{ marginLeft: item.depth * 20 }}>
                <FolderCard
                  folder={item.data}
                  subfolderCount={item.data.subfolderCount}
                  recordingCount={item.data.recordingCount}
                  onPress={() => onFolderPress(item.data)}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                  onCreateSubfolder={handleCreateSubfolder}
                  isReadOnlyDueToDepth={item.data.isReadOnlyDueToDepth}
                  isPending={item.data.pending}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  onToggleExpand={handleToggle}
                />
              </View>
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
    <View style={styles.container}>
      {renderContent()}

      {/* New Folder Modal */}
      <NewFolderModal
        visible={showNewFolderModal}
        onConfirm={async (name) => {
          await handleCreateFolder(name, newFolderParentId);
          setNewFolderParentId(null);
        }}
        onCancel={() => {
          setShowNewFolderModal(false);
          setNewFolderParentId(null);
        }}
        isCreating={isCreating}
      />

      {/* Snackbar */}
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onHide={() => setSnackbarVisible(false)}
      />
    </View>
  );
});

export default FileExplorerContent;

const styles = StyleSheet.create({
  container: {
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