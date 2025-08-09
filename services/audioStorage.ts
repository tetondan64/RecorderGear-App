import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { AudioFile, AudioFileMetadata } from '@/types/audio';
import { StorageService } from './storageService';

const STORAGE_KEY = 'audio_files';
const AUDIO_DIR = `${FileSystem.documentDirectory}RecorderGearApp/AudioFiles/`;

export class AudioStorageService {
  static async initializeStorage(): Promise<void> {
    if (Platform.OS === 'web') {
      return; // Skip file system operations on web
    }
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to initialize audio storage:', error);
    }
  }

  static async clearAllFiles(): Promise<void> {
    try {
      await StorageService.removeItem(STORAGE_KEY);
      console.log('⚠️ All audio files cleared from storage');
    } catch (error) {
      console.error('Failed to clear audio files:', error);
      throw error;
    }
  }

  static async saveAudioFile(fileUri: string, fileName: string, fileSize: number, mimeType?: string): Promise<AudioFile> {
    await this.initializeStorage();
    
    const fileId = this.generateUniqueId();
    const fileExtension = fileName.split('.').pop() || 'mp3';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    let destinationUri: string;
    let audioDuration: number | undefined;
    
    if (Platform.OS === 'web') {
      // On web, convert to blob URL for proper audio playback
      try {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        
        // Convert to Base64 for persistent storage
        const base64Data = await this.blobToBase64(blob);
        destinationUri = URL.createObjectURL(blob);
        
        // Get audio duration
        audioDuration = await this.getAudioDuration(destinationUri);
        
        const audioFile: AudioFile = {
          id: fileId,
          name: fileName,
          uri: destinationUri,
          fileSize,
          duration: audioDuration,
          importDate: new Date().toISOString(),
          mimeType,
          base64Data, // Store Base64 data for persistence
          folderId: null,
          tags: [],
        };

        // Save metadata to AsyncStorage
        await this.saveFileMetadata(audioFile);
        
        return audioFile;
      } catch (error) {
        console.error('Failed to create blob URL:', error instanceof Error ? error.message : 'Unknown error');
        
        // Check for storage quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          throw new Error('Storage limit reached. Please delete some existing files or try a smaller file.');
        }
        
        throw new Error('Failed to import audio file');
      }
    } else {
      destinationUri = `${AUDIO_DIR}${fileId}_${sanitizedFileName}`;
      
      try {
        // Copy file to app storage
        await FileSystem.copyAsync({
          from: fileUri,
          to: destinationUri,
        });
        
        // Get audio duration (native implementation would be different)
        audioDuration = await this.getAudioDuration(destinationUri);
        
        const audioFile: AudioFile = {
          id: fileId,
          name: fileName,
          uri: destinationUri,
          fileSize,
          duration: audioDuration,
          importDate: new Date().toISOString(),
          mimeType,
          folderId: null,
          tags: [],
        };

        // Save metadata to AsyncStorage
        await this.saveFileMetadata(audioFile);
        
        return audioFile;
      } catch (error) {
        console.error('Failed to save audio file:', error);
        throw new Error('Failed to import file. Please try again.');
      }
    }
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the Base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  static base64ToBlob(base64Data: string, mimeType: string = 'audio/mpeg'): Blob {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private static async getAudioDuration(audioUri: string): Promise<number | undefined> {
    if (Platform.OS !== 'web') {
      return undefined;
    }
    
    return new Promise((resolve) => {
      const audio = new Audio(audioUri);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        resolve(undefined);
      });
      audio.load();
    });
  }

  private static generateUniqueId(): string {
    return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
  }

  static async checkForDuplicate(fileName: string, fileSize: number): Promise<boolean> {
    try {
      const existingFiles = await this.getAllFiles();
      return existingFiles.some(file => {
        // Case-insensitive filename comparison with size verification
        const nameMatch = (file.name || '').toLowerCase() === (fileName || '').toLowerCase();
        const sizeMatch = file.fileSize === fileSize;
        
        // Both name and size must match to be considered a duplicate
        return nameMatch && sizeMatch;
      });
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }
  }

  private static async _saveAllFileMetadata(files: AudioFile[]): Promise<void> {
    try {
      // For web platform, exclude transient blob URLs from storage
      const filesToStore = Platform.OS === 'web' 
        ? files.map(file => ({
            ...file,
            uri: '', // Don't store blob URLs as they're not persistent
          }))
        : files;
      
      await StorageService.setItem(STORAGE_KEY, JSON.stringify(filesToStore));
    } catch (error) {
      console.error('Failed to save file metadata:', error);
      throw error;
    }
  }

  static async saveFileMetadata(audioFile: AudioFile): Promise<void> {
    try {
      const existingFiles = await this.getAllFiles();
      const updatedFiles = [...existingFiles, audioFile];
      await this._saveAllFileMetadata(updatedFiles);
    } catch (error) {
      console.error('Failed to save file metadata:', error);
      throw error;
    }
  }

  static async getAllFiles(): Promise<AudioFile[]> {
    try {
      const filesJson = await StorageService.getItem(STORAGE_KEY);
      if (!filesJson) return [];
      
      const files: AudioFile[] = JSON.parse(filesJson);
      
      // For web platform, recreate blob URLs from Base64 data
      if (Platform.OS === 'web') {
        const processedFiles = files.map(file => {
          if (file.base64Data) {
            const blob = this.base64ToBlob(file.base64Data, file.mimeType || 'audio/mpeg');
            const blobUrl = URL.createObjectURL(blob);
            return { ...file, uri: blobUrl };
          }
          return file;
        });
        return processedFiles.sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
      }
      
      // Sort by import date (newest first)
      return files.sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
    } catch (error) {
      console.error('Failed to get audio files:', error);
      return [];
    }
  }

  static async deleteFile(fileId: string): Promise<void> {
    try {
      const files = await this.getAllFiles();
      const fileToDelete = files.find(f => f.id === fileId);
      
      if (fileToDelete) {
        // Delete physical file (only on native platforms)
        if (Platform.OS !== 'web') {
          const fileInfo = await FileSystem.getInfoAsync(fileToDelete.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(fileToDelete.uri);
          }
        }
        
        // Remove from metadata
        const updatedFiles = files.filter(f => f.id !== fileId);
        await this._saveAllFileMetadata(updatedFiles);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file. Please try again.');
    }
  }

  static async getFileById(fileId: string): Promise<AudioFile | null> {
    try {
      const files = await this.getAllFiles();
      return files.find(f => f.id === fileId) || null;
    } catch (error) {
      console.error('Failed to get file by ID:', error);
      return null;
    }
  }

  static async updateFileTranscriptStatus(fileId: string, hasTranscript: boolean): Promise<void> {
    try {
      console.log(`🔄 Updating transcript status for ${fileId}: ${hasTranscript}`);
      const files = await this.getAllFiles();
      console.log(`📁 Current files count: ${files.length}`);
      
      const updatedFiles = files.map(file => 
        file.id === fileId ? { ...file, hasTranscript } : file
      );
      
      console.log(`📁 Updated files count: ${updatedFiles.length}`);
      const targetFile = updatedFiles.find(f => f.id === fileId);
      console.log(`🎯 Target file found:`, !!targetFile, targetFile ? `hasTranscript: ${targetFile.hasTranscript}` : 'not found');
      
      await this._saveAllFileMetadata(updatedFiles);
      console.log(`✅ File transcript status updated successfully`);
    } catch (error) {
      console.error('Failed to update transcript status:', error);
      throw error;
    }
  }

  static async updateAudioFile(fileId: string, updates: Partial<AudioFile>): Promise<AudioFile | null> {
    try {
      const files = await this.getAllFiles();
      const fileIndex = files.findIndex(f => f.id === fileId);
      
      if (fileIndex === -1) {
        return null;
      }

      const updatedFile = {
        ...files[fileIndex],
        ...updates,
      };

      files[fileIndex] = updatedFile;
      await this._saveAllFileMetadata(files);
      
      return updatedFile;
    } catch (error) {
      console.error('Failed to update audio file:', error);
      throw error;
    }
  }

  static async renameAudioFile(fileId: string, newName: string): Promise<AudioFile> {
    try {
      const files = await this.getAllFiles();
      const fileToRename = files.find(f => f.id === fileId);
      
      if (!fileToRename) {
        throw new Error('File not found');
      }

      // Extract original extension
      const originalExtension = fileToRename.name.split('.').pop() || 'mp3';
      const newFileName = `${newName}.${originalExtension}`;
      
      // Check for duplicate names
      const isDuplicate = files.some(f => 
        f.id !== fileId && 
        f.name.toLowerCase() === newFileName.toLowerCase()
      );
      
      if (isDuplicate) {
        throw new Error('A file with this name already exists');
      }

      let newUri = fileToRename.uri;
      
      // Handle file system rename for native platforms
      if (Platform.OS !== 'web' && fileToRename.uri.startsWith(AUDIO_DIR)) {
        const sanitizedNewName = newFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const newPath = `${AUDIO_DIR}${fileId}_${sanitizedNewName}`;
        
        // Rename the actual file
        await FileSystem.moveAsync({
          from: fileToRename.uri,
          to: newPath,
        });
        
        newUri = newPath;
      }

      // Update file metadata
      const updatedFile: AudioFile = {
        ...fileToRename,
        name: newFileName,
        uri: newUri,
      };

      // Update in storage
      const updatedFiles = files.map(f => 
        f.id === fileId ? updatedFile : f
      );
      
      await this._saveAllFileMetadata(updatedFiles);
      
      console.log(`✅ File renamed from "${fileToRename.name}" to "${newFileName}"`);
      return updatedFile;
      
    } catch (error) {
      console.error('Failed to rename file:', error);
      throw error;
    }
  }
}