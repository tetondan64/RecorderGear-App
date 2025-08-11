import { useState, useEffect, useCallback } from 'react';
import { AudioFile } from '@/types/audio';
import { AudioStorageService } from '@/services/audioStorage';
import { TranscriptService } from '@/services/transcriptService';
import { RecordingsStore } from '@/data/recordingsStore';
import logger from '@/utils/logger';

export function useAudioFiles() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = RecordingsStore.addStoreChangeListener(() => {
      loadFiles();
    });
    
    return unsubscribe;
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const audioFiles = await AudioStorageService.getAllFiles();
      
      // Check transcript status for each file
      const filesWithTranscriptStatus = await Promise.all(
        audioFiles.map(async (file) => {
          const hasTranscript = await TranscriptService.hasTranscript(file.id);
          return { ...file, hasTranscript };
        })
      );
      
      setFiles(filesWithTranscriptStatus);
    } catch (err) {
      setError('Failed to load audio files');
      logger.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addFile = useCallback(async (fileUri: string, fileName: string, fileSize: number, mimeType?: string) => {
    try {
      setError(null);
      
      // Check for duplicates before attempting to save
      const isDuplicate = await AudioStorageService.checkForDuplicate(fileName, fileSize);
      if (isDuplicate) {
        throw new Error('DUPLICATE_FILE');
      }
      
      const newFile = await AudioStorageService.saveAudioFile(fileUri, fileName, fileSize, mimeType);
      setFiles(prev => [newFile, ...prev]);
      return newFile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setError(null);
      
      // Store original file for rollback
      const originalFile = files.find(f => f.id === fileId);
      if (!originalFile) {
        throw new Error('File not found');
      }
      
      // Optimistic update - remove file immediately
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      await AudioStorageService.deleteFile(fileId);
    } catch (err) {
      // Rollback on error - restore the file
      if (originalFile) {
        setFiles(prev => [...prev, originalFile].sort((a, b) => 
          new Date(b.importDate).getTime() - new Date(a.importDate).getTime()
        ));
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const updateFileTranscriptStatus = useCallback(async (fileId: string, hasTranscript: boolean) => {
    try {
      setError(null);
      
      // Store original file for rollback
      const originalFile = files.find(f => f.id === fileId);
      if (!originalFile) {
        throw new Error('File not found');
      }
      
      // Optimistic update - update transcript status immediately
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, hasTranscript }
          : file
      ));
      
      // Update the file in storage
      await AudioStorageService.updateFileTranscriptStatus(fileId, hasTranscript);
      
      logger.log(`✅ Updated transcript status for ${fileId}: ${hasTranscript}`);
    } catch (err) {
      // Rollback on error - restore original file
      if (originalFile) {
        setFiles(prev => prev.map(file => 
          file.id === fileId ? originalFile : file
        ));
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transcript status';
      setError(errorMessage);
      logger.error('Error updating transcript status:', err);
    }
  }, []);

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      setError(null);
      
      // Store original file for rollback
      const originalFile = files.find(f => f.id === fileId);
      if (!originalFile) {
        throw new Error('File not found');
      }
      
      // Optimistic update - update file name immediately
      const optimisticFile = { ...originalFile, name: newName };
      setFiles(prev => prev.map(file => 
        file.id === fileId ? optimisticFile : file
      ));
      
      const updatedFile = await AudioStorageService.renameAudioFile(fileId, newName);
      
      // Update with actual result from service
      setFiles(prev => prev.map(file => 
        file.id === fileId ? updatedFile : file
      ));
      
      return updatedFile;
    } catch (err) {
      // Rollback on error - restore original file
      if (originalFile) {
        setFiles(prev => prev.map(file => 
          file.id === fileId ? originalFile : file
        ));
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    files,
    loading,
    error,
    addFile,
    deleteFile,
    refreshFiles: loadFiles,
    updateFileTranscriptStatus,
    renameFile,
  };
}