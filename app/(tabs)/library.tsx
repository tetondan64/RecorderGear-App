import React, { useState } from 'react';
import { View, FlatList, Alert, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Headphones, Plus, Trash2, Search, ListFilter as Filter, Calendar, Tag, Folder } from 'lucide-react-native';
import { router } from 'expo-router';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import FileCard from '@/components/FileCard';
import SnackBar from '@/components/SnackBar';
import ConfirmModal from '@/components/ConfirmModal';
import SearchBar from '@/components/SearchBar';
import SearchFilterChip from '@/components/SearchFilterChip';
import { useAudioFiles } from '@/hooks/useAudioFiles';
import { useFilePicker } from '@/hooks/useFilePicker';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useTranscription } from '@/hooks/useTranscription';
import { useFolders } from '@/hooks/useFolders';
import { useTags } from '@/hooks/useTags';
import TranscriptionModal from '@/components/TranscriptionModal';
import FolderDropdown from '@/components/FolderDropdown';
import FolderFilterChip from '@/components/FolderFilterChip';
import TagDropdown from '@/components/TagDropdown';
import TagFilterChips from '@/components/TagFilterChips';
import DateFilterModal from '@/components/DateFilterModal';
import DateFilterChip from '@/components/DateFilterChip';
import { useDateFilter } from '@/hooks/useDateFilter';
import { TranscriptService } from '@/services/transcriptService';
import { AudioStorageService } from '@/services/audioStorage';

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 16,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderWidth: 2,
    borderColor: '#f4ad3d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f4ad3d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterMenu: {
    position: 'absolute',
    top: 80,
    right: 24,
    zIndex: 10,
    elevation: 10,
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
  },
  filterMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  viewToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: 'rgba(244, 173, 61, 0.2)',
  },
  viewToggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  viewToggleButtonTextActive: {
    color: '#f4ad3d',
  },
});

export default function LibraryScreen() {
  const { files, loading, error, addFile, deleteFile, refreshFiles, updateFileTranscriptStatus, renameFile } = useAudioFiles();
  const { folders, activeFilter, setFolderFilter, clearFilter } = useFolders();
  const { tags, activeFilter: tagFilter, setTagsFilter, removeTagFromFilter, clearTagsFilter } = useTags();
  const { activeFilter: dateFilter, hasActiveFilter: hasDateFilter, setDateFilter, clearDateFilter, isDateInFilter } = useDateFilter();
  const { pickAudioFile } = useFilePicker();
  const { playPause, seekTo, getCurrentTime, isPlaying, stopPlaybackIfPlaying } = useAudioPlayer(files);
  const { isTranscribing, progress, error: transcriptionError, transcribeFile: transcribeFileFromHook, resetTranscription } = useTranscription();
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [transcribingFile, setTranscribingFile] = useState<any>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'expanded' | 'retracted'>('expanded');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleImportFile = async () => {
    try {
      const selectedFile = await pickAudioFile();
      if (selectedFile) {
        await addFile(selectedFile.uri, selectedFile.name, selectedFile.size, selectedFile.mimeType);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_FILE') {
        showSnackbar('This file has already been added.');
      } else {
        const message = error instanceof Error ? error.message : 'Failed to import file';
        Alert.alert('Import Error', message);
      }
    }
  };

  // Filter files based on active folder filter
  const filteredFiles = files.filter(file => {
    // Apply folder filter
    const folderMatch = activeFilter.folderId 
      ? file.folderId === activeFilter.folderId
      : true;
    
    // Apply tag filter (file must have ALL selected tags)
    const tagMatch = tagFilter.selectedTagIds.length > 0
      ? tagFilter.selectedTagIds.every(tagId => file.tags?.includes(tagId))
      : true;
    
    // Apply date filter
    const dateMatch = hasDateFilter
      ? isDateInFilter(file.importDate)
      : true;
    
    return folderMatch && tagMatch && dateMatch;
  });

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch && searchQuery) {
      // Clear search when closing
      setSearchQuery('');
    }
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleDateFilterApply = (dateRange: any, displayText: string) => {
    setDateFilter(dateRange, displayText);
  };

  const handleDateFilterClear = () => {
    clearDateFilter();
  };

  const handleClearAllFiles = async () => {
    try {
      // Stop any currently playing audio
      stopPlaybackIfPlaying();
      
      // Clear all files from storage
      await AudioStorageService.clearAllFiles();
      
      // Refresh the file list
      await refreshFiles();
      
      setShowClearAllModal(false);
      showSnackbar('All files cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear files');
    }
  };

  const handleFilePress = (fileId: string) => {
    if (!fileId) {
      Alert.alert('Error', 'Unable to open file. Please try again.');
      return;
    }
    
    const fileExists = files.find(f => f.id === fileId);
    if (!fileExists) {
      Alert.alert('Error', 'File no longer available. Please refresh the library.');
      return;
    }
    
    router.push(`/viewer/${fileId}`);
  };

  const handleShareFile = (file: any) => {
    Alert.alert('Share', `Sharing ${file.name}...`);
  };

  const handleDeleteAudio = async (file: any) => {
    try {
      // Stop playback if this file is currently playing
      stopPlaybackIfPlaying(file.id);
      
      await deleteFile(file.id);
      showSnackbar('Audio file deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete audio file');
    }
  };

  const handleDeleteTranscription = async (file: any) => {
    try {
      await TranscriptService.deleteTranscriptByFileId(file.id);
      await updateFileTranscriptStatus(file.id, false);
      showSnackbar('Transcription deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete transcription');
    }
  };

  const handleTranscribeFile = async (file: any) => {
    console.log('🎯 handleTranscribeFile called for:', file.name, 'hasTranscript:', file.hasTranscript);
    
    // If file already has transcript, navigate to viewer instead
    if (file.hasTranscript) {
      console.log('📖 File already has transcript, navigating to viewer');
      router.push(`/viewer/${file.id}`);
      return;
    }
    
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        'OpenAI API key not found. Please check your .env file contains EXPO_PUBLIC_OPENAI_API_KEY.',
        [{ text: 'OK' }]
      );
      return;
    }

    setTranscribingFile(file);
    setShowTranscriptionModal(true);
    resetTranscription();

    try {
      console.log('🚀 Starting transcription for:', file.name);
      const result = await transcribeFileFromHook(file, apiKey);
      
      console.log('💾 Creating transcript from result...');
      const storedTranscript = await TranscriptService.createTranscriptFromWhisper(
        file.id,
        result.segments,
        result.fullText,
        result.language,
        result.duration
      );
      
      console.log('🔍 Verifying stored transcript...');
      const verifyTranscript = await TranscriptService.getTranscriptByFileId(file.id);
      
      if (!verifyTranscript) {
        throw new Error('Failed to retrieve stored transcript');
      }
      
      console.log('✅ Updating file transcript status...');
      // Update transcript status without full refresh
      await updateFileTranscriptStatus(file.id, true);
      
      console.log('🎉 Transcription completed successfully, navigating to viewer...');
      setTimeout(() => {
        setShowTranscriptionModal(false);
        setTranscribingFile(null);
        resetTranscription();
        router.push(`/viewer/${file.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      // Don't navigate away on error - keep the modal open to show error state
    }
  };

  const handleRenameFile = async (file: any, newName: string) => {
    try {
      const updatedFile = await renameFile(file.id, newName);
      showSnackbar(`File renamed to: ${updatedFile.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename file';
      Alert.alert('Rename Error', message);
    }
  };

  const handleRetryTranscription = () => {
    if (transcribingFile) {
      handleTranscribeFile(transcribingFile);
    }
  };

  const handleCloseTranscriptionModal = () => {
    setShowTranscriptionModal(false);
    setTranscribingFile(null);
    resetTranscription();
  };

  return (
    <Layout>
      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'expanded' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('expanded')}
          >
            <Text style={[styles.viewToggleButtonText, viewMode === 'expanded' && styles.viewToggleButtonTextActive]}>Expanded</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'retracted' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('retracted')}
          >
            <Text style={[styles.viewToggleButtonText, viewMode === 'retracted' && styles.viewToggleButtonTextActive]}>Retracted</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleSearchToggle}
          >
            <Search size={20} color={searchQuery ? "#3B82F6" : "rgba(255, 255, 255, 0.7)"} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterMenu(prev => !prev)}
          >
            <Filter size={20} color={showFilterMenu ? "#f4ad3d" : "rgba(255, 255, 255, 0.7)"} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleImportFile}
          >
            <Plus size={28} color="#f4ad3d" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenu}>
          <TouchableOpacity
            style={styles.filterMenuButton}
            onPress={() => {
              setShowDateModal(true);
              setShowFilterMenu(false);
            }}
          >
            <Calendar
              size={20}
              color={hasDateFilter ? "#8B5CF6" : "rgba(255, 255, 255, 0.7)"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterMenuButton}
            onPress={() => {
              setShowTagDropdown(true);
              setShowFilterMenu(false);
            }}
          >
            <Tag
              size={20}
              color={tagFilter.selectedTagIds.length > 0 ? "#f4ad3d" : "rgba(255, 255, 255, 0.7)"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterMenuButton}
            onPress={() => {
              setShowFolderDropdown(true);
              setShowFilterMenu(false);
            }}
          >
            <Folder size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <SearchBar
        visible={showSearch}
        query={searchQuery}
        onQueryChange={handleSearchQueryChange}
        onClose={handleSearchToggle}
        placeholder="Search by title..."
      />
      
      {/* Search Filter Chip */}
      <SearchFilterChip
        query={searchQuery}
        onClear={handleClearSearch}
      />
      
      {/* Date Filter Chip */}
      {hasDateFilter && dateFilter.displayText && (
        <DateFilterChip
          displayText={dateFilter.displayText}
          onClear={handleDateFilterClear}
        />
      )}
      
      {/* Folder Filter Chip */}
      {activeFilter.folderName && (
        <FolderFilterChip
          folderName={activeFilter.folderName}
          onClear={clearFilter}
        />
      )}
      
      {/* Tag Filter Chips */}
      <TagFilterChips
        selectedTags={tagFilter.selectedTags}
        onRemoveTag={removeTagFromFilter}
        onClearAll={clearTagsFilter}
      />
      
      {filteredFiles.length === 0 ? (
        activeFilter.folderId || tagFilter.selectedTagIds.length > 0 || searchQuery.trim() || hasDateFilter ? (
          <EmptyState
            icon={searchQuery.trim() ? <Search size={48} color="#3B82F6" strokeWidth={1.5} /> :
                  hasDateFilter ? <Calendar size={48} color="#8B5CF6" strokeWidth={1.5} /> :
                  activeFilter.folderId ? <Folder size={48} color="#f4ad3d" strokeWidth={1.5} /> : 
                  <Tag size={48} color="#f4ad3d" strokeWidth={1.5} />}
            title={searchQuery.trim() ? "No matching recordings" :
                   hasDateFilter ? "No recordings in date range" :
                   activeFilter.folderId ? "No files in this folder" : 
                   "No files with selected tags"}
            subtitle={searchQuery.trim()
              ? `No recordings found matching "${searchQuery}"`
              : hasDateFilter
                ? `No recordings found for ${dateFilter.displayText}`
              : activeFilter.folderId 
                ? `The "${activeFilter.folderName}" folder is empty`
                : "Try selecting different tags or add tags to your recordings"
            }
            buttonText="+ Import Audio"
            onButtonPress={handleImportFile}
          />
        ) : (
        <EmptyState
          icon={<Headphones size={48} color="#f4ad3d" strokeWidth={1.5} />}
          title="No audio files found."
          subtitle="Import audio files to start transcribing with AI"
          buttonText="+ Import Audio"
          onButtonPress={handleImportFile}
        />
        )
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item, index) => item.id + '-' + index}
          renderItem={({ item }) => (
            <FileCard
              file={item}
              onPress={() => handleFilePress(item.id)}
              onDeleteAudio={handleDeleteAudio}
              onDeleteTranscription={handleDeleteTranscription}
              onTranscribe={handleTranscribeFile}
              onRename={handleRenameFile}
              onShare={handleShareFile}
              isPlaying={isPlaying(item.id)}
              currentTime={getCurrentTime(item.id)}
              onPlayPause={(fileId) => playPause(fileId)}
              onSeek={seekTo}
              stopPlaybackIfPlaying={stopPlaybackIfPlaying}
              collapsed={viewMode === 'retracted'}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 0 }}
        />
      )}

      {/* Folder Dropdown */}
      <FolderDropdown
        visible={showFolderDropdown}
        onClose={() => setShowFolderDropdown(false)}
        onFolderSelect={setFolderFilter}
        selectedFolderId={activeFilter.folderId}
      />

      {/* Tag Dropdown */}
      <TagDropdown
        visible={showTagDropdown}
        onClose={() => setShowTagDropdown(false)}
        onTagsSelect={setTagsFilter}
        selectedTagIds={tagFilter.selectedTagIds}
      />

      {/* Date Filter Modal */}
      <DateFilterModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onApply={handleDateFilterApply}
        currentRange={dateFilter.dateRange}
      />

      {/* Transcription Modal */}
      <TranscriptionModal
        visible={showTranscriptionModal}
        fileName={transcribingFile?.name || ''}
        progress={progress}
        isTranscribing={isTranscribing}
        error={transcriptionError}
        onClose={handleCloseTranscriptionModal}
        onRetry={transcriptionError ? handleRetryTranscription : undefined}
      />

      {/* Clear All Files Confirmation Modal */}
      <ConfirmModal
        visible={showClearAllModal}
        title="Clear All Files"
        message="Are you sure you want to delete all audio files and their transcriptions? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={handleClearAllFiles}
        onCancel={() => setShowClearAllModal(false)}
        destructive={true}
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