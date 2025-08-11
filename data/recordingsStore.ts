import { Platform } from 'react-native';
import { AudioFile } from '@/types/audio';
import { Tag } from '@/types/tag';
import { Folder } from '@/types/folder';
import { StoreEvent } from '@/types/store';
import { AudioStorageService } from '@/services/audioStorage';
import { FolderService } from '@/services/folderService';
import { StorageService } from '@/services/storageService';

// Storage key
const TAGS_KEY = 'rg.tags.v1';

// Store change listeners
type StoreChangeListener = () => void;
type StoreChangeListenerWithEvent = (event?: StoreEvent) => void;
const storeChangeListeners: StoreChangeListener[] = [];
const storeChangeListenersWithEvent: StoreChangeListenerWithEvent[] = [];

// Cross-tab synchronization for web platform
let syncChannel: BroadcastChannel | null = null;
const instanceId = Math.random().toString(36).substring(2, 15);

// Initialize BroadcastChannel for web platform
if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    syncChannel = new window.BroadcastChannel('recordings-store-sync');
    syncChannel.onmessage = (event) => {
      // Only process messages from other tabs/windows
      if (event.data.instanceId !== instanceId) {
        console.log('📡 Received cross-tab sync event:', event.data.type);
        RecordingsStore.notifyStoreChanged(true, event.data.event); // fromBroadcast = true
      }
    };
    console.log('📡 BroadcastChannel initialized for cross-tab sync');
  } catch (error) {
    console.warn('Failed to initialize BroadcastChannel:', error);
  }
}

export class RecordingsStore {
  // Utility functions
  static generateUniqueId(): string {
    return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
  }

  static notifyStoreChanged(fromBroadcast: boolean = false, event?: StoreEvent): void {
    // Broadcast to other tabs/windows on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined' && !fromBroadcast && syncChannel && event) {
      try {
        syncChannel.postMessage({
          type: event.type || 'store-changed',
          instanceId,
          timestamp: Date.now(),
          event,
        });
      } catch (error) {
        console.warn('Failed to broadcast store change:', error);
      }
    }
    
    storeChangeListeners.forEach(listener => listener());
    storeChangeListenersWithEvent.forEach(listener => listener(event));
  }

  static addStoreChangeListener(listener: StoreChangeListener): () => void {
    storeChangeListeners.push(listener);
    return () => {
      const index = storeChangeListeners.indexOf(listener);
      if (index > -1) {
        storeChangeListeners.splice(index, 1);
      }
    };
  }

  static addStoreChangeListenerWithEvent(listener: StoreChangeListenerWithEvent): () => void {
    storeChangeListenersWithEvent.push(listener);
    return () => {
      const index = storeChangeListenersWithEvent.indexOf(listener);
      if (index > -1) {
        storeChangeListenersWithEvent.splice(index, 1);
      }
    };
  }

  static async updateRecordingTags(recordingId: string, tagIds: string[]): Promise<AudioFile | null> {
    try {
      const updatedRecording = await AudioStorageService.updateAudioFile(recordingId, { tags: tagIds });
      if (!updatedRecording) {
        throw new Error('Recording not found');
      }

      this.notifyStoreChanged();
      
      console.log('✅ Recording tags updated:', recordingId, tagIds);
      return updatedRecording;
    } catch (error) {
      console.error('Failed to update recording tags:', error);
      throw error;
    }
  }

  static async moveRecordingToFolder(recordingId: string, folderId: string | null): Promise<AudioFile | null> {
    try {
      const updatedRecording = await AudioStorageService.updateAudioFile(recordingId, { folderId: folderId ?? undefined });
      if (!updatedRecording) {
        throw new Error('Recording not found');
      }

      this.notifyStoreChanged();
      
      console.log('✅ Recording moved to folder:', recordingId, folderId);
      return updatedRecording;
    } catch (error) {
      console.error('Failed to move recording to folder:', error);
      throw error;
    }
  }

  // Tags
  static async getTags(): Promise<Tag[]> {
    try {
      const data = await StorageService.getItem(TAGS_KEY);
      const tags = data ? JSON.parse(data) : [];
      return tags.sort((a: Tag, b: Tag) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  }

  static async setTags(tags: Tag[]): Promise<void> {
    try {
      await StorageService.setItem(TAGS_KEY, JSON.stringify(tags));
      this.notifyStoreChanged();
    } catch (error) {
      console.error('Failed to set tags:', error);
      throw error;
    }
  }

  static async createTag(name: string): Promise<Tag> {
    try {
      const trimmedName = name.trim();
      
      if (!trimmedName) {
        throw new Error('Tag name cannot be empty');
      }

      if (trimmedName.length > 32) {
        throw new Error('Tag name must be 32 characters or less');
      }

      const existingTags = await this.getTags();
      const isDuplicate = existingTags.some(tag => 
        tag.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('A tag with this name already exists');
      }

      const colors = ['#f4ad3d', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899'];
      const newTag: Tag = {
        id: this.generateUniqueId(),
        name: trimmedName,
        createdAt: Date.now(),
        color: colors[Math.floor(Math.random() * colors.length)],
      };

      const updatedTags = [...existingTags, newTag];
      await this.setTags(updatedTags);
      
      return newTag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      throw error;
    }
  }

  static async deleteTag(tagId: string): Promise<void> {
    try {
      // Remove tag from all recordings
      const recordings = await AudioStorageService.getAllFiles();
      const updatedRecordings = recordings.map(recording => ({
        ...recording,
        tags: recording.tags?.filter(id => id !== tagId) || [],
      }));
      
      // Update each recording individually
      for (const recording of updatedRecordings) {
        await AudioStorageService.updateAudioFile(recording.id, { tags: recording.tags });
      }

      // Remove tag from tags list
      const tags = await this.getTags();
      const updatedTags = tags.filter(t => t.id !== tagId);
      await this.setTags(updatedTags);
      
      this.notifyStoreChanged();
      console.log('✅ Tag deleted globally:', tagId);
    } catch (error) {
      console.error('Failed to delete tag:', error);
      throw error;
    }
  }
  // File Explorer specific methods
  static async getFoldersInFolder(parentId: string | null): Promise<Folder[]> {
    try {
      console.log('🔍 RecordingsStore.getFoldersInFolder called with parentId:', parentId);
      const result = await FolderService.getFoldersByParentId(parentId);
      console.log('🔍 RecordingsStore.getFoldersInFolder result:', result.length, result.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })));
      return result;
    } catch (error) {
      console.error('Failed to get folders in folder:', error);
      return [];
    }
  }

  static async getRecordingsInFolder(folderId: string | null): Promise<AudioFile[]> {
    try {
      const allRecordings = await AudioStorageService.getAllFiles();
      return allRecordings.filter(recording => recording.folderId === folderId);
    } catch (error) {
      console.error('Failed to get recordings in folder:', error);
      return [];
    }
  }

  static async getFolderPath(folderId: string | null): Promise<Folder[]> {
    try {
      return await FolderService.getFolderPath(folderId);
    } catch (error) {
      console.error('Failed to get folder path:', error);
      return [];
    }
  }

  static async renameFolder(folderId: string, newName: string): Promise<Folder> {
    try {
      const renamedFolder = await FolderService.renameFolder(folderId, newName);
      return renamedFolder;
    } catch (error) {
      console.error('Failed to rename folder:', error);
      throw error;
    }
  }

  static async deleteRecording(recordingId: string): Promise<void> {
    try {
      await AudioStorageService.deleteFile(recordingId);
      this.notifyStoreChanged();
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  static async updateRecordingTranscriptStatus(recordingId: string, hasTranscript: boolean): Promise<void> {
    try {
      await AudioStorageService.updateFileTranscriptStatus(recordingId, hasTranscript);
      this.notifyStoreChanged();
    } catch (error) {
      console.error('Failed to update transcript status:', error);
      throw error;
    }
  }

  static async renameRecording(recordingId: string, newName: string): Promise<AudioFile> {
    try {
      const renamedFile = await AudioStorageService.renameAudioFile(recordingId, newName);
      this.notifyStoreChanged();
      return renamedFile;
    } catch (error) {
      console.error('Failed to rename recording:', error);
      throw error;
    }
  }

  // Folders
  static async getFolders(): Promise<Folder[]> {
    try {
      return await FolderService.getAllFolders();
    } catch (error) {
      console.error('Failed to get folders:', error);
      return [];
    }
  }

  static async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    try {
      const newFolder = await FolderService.createFolder(name, parentId);
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  static async deleteFolder(folderId: string): Promise<void> {
    try {
      // Get folder info before deletion for event
      const folder = await FolderService.getFolderById(folderId);
      const parentId = folder?.parentId || null;
      
      // Get all folders to find children
      const allFolders = await FolderService.getAllFolders();
      const childFolders = allFolders.filter(f => f.parentId === folderId);
      
      // Recursively delete child folders first
      for (const childFolder of childFolders) {
        await this.deleteFolder(childFolder.id);
      }
      
      // Remove folder reference from all recordings
      const recordings = await AudioStorageService.getAllFiles();
      const updatedRecordings = recordings.map(recording => ({
        ...recording,
        folderId: recording.folderId === folderId ? null : recording.folderId,
      }));
      
      // Update each recording individually
      for (const recording of updatedRecordings) {
        if (recording.folderId !== recordings.find(r => r.id === recording.id)?.folderId) {
          await AudioStorageService.updateAudioFile(recording.id, { folderId: recording.folderId ?? undefined });
        }
      }

      // Remove folder from storage
      await FolderService.deleteFolder(folderId);
      
      console.log('✅ Folder deleted globally:', folderId);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }

  static async moveFolder(folderId: string, newParentId: string | null): Promise<Folder> {
    try {
      // Get the folder to move
      const folderToMove = await FolderService.getFolderById(folderId);
      if (!folderToMove) {
        throw new Error('Folder not found');
      }

      // Validate depth constraints
      const newDepth = await FolderService.getFolderDepth(newParentId);
      if (newDepth >= 2) {
        throw new Error('Cannot move folder: would exceed maximum depth of 2 levels');
      }

      // Check for name conflicts in destination
      const siblings = await FolderService.getFoldersByParentId(newParentId);
      const nameConflict = siblings.some(sibling => 
        sibling.id !== folderId && 
        sibling.name.toLowerCase() === folderToMove.name.toLowerCase()
      );

      if (nameConflict) {
        throw new Error('A folder with this name already exists in the destination');
      }

      // Update the folder's parent
      const updatedFolder = await FolderService.renameFolder(folderId, folderToMove.name);
      updatedFolder.parentId = newParentId;
      
      // Save the updated folder
      const allFolders = await FolderService.getAllFolders();
      const updatedFolders = allFolders.map(f => 
        f.id === folderId ? updatedFolder : f
      );
      await FolderService._saveAllFolders(updatedFolders);


      console.log('✅ Folder moved:', folderId, 'to parent:', newParentId);
      return updatedFolder;
    } catch (error) {
      console.error('Failed to move folder:', error);
      throw error;
    }
  }

  // Tag management with counts
  static async getTagsWithCounts(): Promise<Array<Tag & { recordingCount: number }>> {
    try {
      const [tags, recordings] = await Promise.all([
        this.getTags(),
        AudioStorageService.getAllFiles()
      ]);

      // Count recordings for each tag
      const tagCounts = new Map<string, number>();
      
      recordings.forEach(recording => {
        if (recording.tags && Array.isArray(recording.tags)) {
          recording.tags.forEach(tagId => {
            tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
          });
        }
      });

      // Combine tags with their counts
      const tagsWithCounts = tags.map(tag => ({
        ...tag,
        recordingCount: tagCounts.get(tag.id) || 0,
      }));

      return tagsWithCounts;
    } catch (error) {
      console.error('Failed to get tags with counts:', error);
      return [];
    }
  }

  static async renameTag(tagId: string, newName: string): Promise<Tag> {
    try {
      const trimmedName = newName.trim();
      
      if (!trimmedName) {
        throw new Error('Tag name cannot be empty');
      }

      if (trimmedName.length > 32) {
        throw new Error('Tag name must be 32 characters or less');
      }

      const tags = await this.getTags();
      const tagToRename = tags.find(t => t.id === tagId);
      
      if (!tagToRename) {
        throw new Error('Tag not found');
      }

      // Check for duplicates (excluding current tag)
      const isDuplicate = tags.some(tag => 
        tag.id !== tagId && 
        tag.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('A tag with this name already exists');
      }

      const updatedTag: Tag = {
        ...tagToRename,
        name: trimmedName,
      };

      const updatedTags = tags.map(t => 
        t.id === tagId ? updatedTag : t
      );
      
      await this.setTags(updatedTags);
      
      console.log('✅ Tag renamed:', updatedTag.name);
      return updatedTag;
    } catch (error) {
      console.error('Failed to rename tag:', error);
      throw error;
    }
  }

  static async getFolderWithCounts(folderId: string | null): Promise<{
    folder: Folder | null;
    subfolderCount: number;
    recordingCount: number;
  }> {
    try {
      const folder = folderId ? await FolderService.getFolderById(folderId) : null;
      const subfolders = await this.getFoldersInFolder(folderId);
      const recordings = await this.getRecordingsInFolder(folderId);
      
      return {
        folder,
        subfolderCount: subfolders.length,
        recordingCount: recordings.length,
      };
    } catch (error) {
      console.error('Failed to get folder with counts:', error);
      return {
        folder: null,
        subfolderCount: 0,
        recordingCount: 0,
      };
    }
  }

  static async getFoldersWithCounts(parentId: string | null): Promise<Array<Folder & { subfolderCount: number; recordingCount: number }>> {
    try {
      console.log('🔍 RecordingsStore.getFoldersWithCounts called with parentId:', parentId);
      
      const folders = await this.getFoldersInFolder(parentId);
      console.log('🔍 RecordingsStore: Found folders:', folders.length, folders.map(f => f.name));
      
      // Get counts for each folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          const { subfolderCount, recordingCount } = await this.getFolderWithCounts(folder.id);
          const folderDepth = await FolderService.getFolderDepth(folder.id);
          const isReadOnlyDueToDepth = folderDepth > 2;
          
          console.log(`🔍 RecordingsStore: Folder "${folder.name}" counts:`, { subfolderCount, recordingCount });
          return {
            ...folder,
            subfolderCount,
            recordingCount,
            isReadOnlyDueToDepth,
          };
        })
      );
      
      console.log('🔍 RecordingsStore: Returning folders with counts:', foldersWithCounts.length);
      return foldersWithCounts;
    } catch (error) {
      console.error('Failed to get folders with counts:', error);
      return [];
    }
  }
}