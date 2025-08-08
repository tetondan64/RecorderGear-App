import { Folder } from '@/types/folder';
import { StorageService } from './storageService';
import { AudioStorageService } from './audioStorage';
import { RecordingsStore } from '@/data/recordingsStore';

// Unified storage key for all folder operations
const UNIFIED_STORAGE_KEY = 'rg.folders.v1';
const OLD_STORAGE_KEY = 'folders';
const MIGRATION_COMPLETE_FLAG = 'folders_migration_v1_complete';

export class FolderService {
  static readonly UNIFIED_STORAGE_KEY = 'rg.folders.v1';
  static readonly OLD_STORAGE_KEY = 'folders';
  static readonly MIGRATION_COMPLETE_FLAG = 'folders_migration_v1_complete';
  
  // Cache for getAllFolders with 5-second TTL
  private static readonly CACHE_DURATION_MS = 5000;
  private static allFoldersCache: { data: Folder[]; timestamp: number } | null = null;

  // Expose _saveAllFolders for FoldersAdapter
  static async _saveAllFolders(folders: Folder[]): Promise<void> {
    try {
      // Invalidate cache on any write operation
      this.allFoldersCache = null;
      await StorageService.setItem(this.UNIFIED_STORAGE_KEY, JSON.stringify(folders));
    } catch (error) {
      console.error('Failed to save folders:', error);
      throw error;
    }
  }

  static generateUniqueId(): string {
    return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private static generateUniqueFolderName(baseName: string, existingNames: Set<string>): string {
    let counter = 2;
    let candidateName = `${baseName} (${counter})`;
    
    while (existingNames.has(candidateName.toLowerCase())) {
      counter++;
      candidateName = `${baseName} (${counter})`;
    }
    
    return candidateName;
  }

  private static async _saveAllFolders(folders: Folder[]): Promise<void> {
    try {
      await StorageService.setItem(this.UNIFIED_STORAGE_KEY, JSON.stringify(folders));
    } catch (error) {
      console.error('Failed to save folders:', error);
      throw error;
    }
  }

  private static async performMigration(): Promise<void> {
    try {
      // Check if migration has already been completed
      const migrationComplete = await StorageService.getItem(this.MIGRATION_COMPLETE_FLAG);
      if (migrationComplete === 'true') {
        return; // Migration already done
      }

      console.log('🔄 Starting folder migration...');

      // Load folders from both old and new storage keys for reconciliation
      const oldFoldersJson = await StorageService.getItem(this.OLD_STORAGE_KEY);
      const unifiedFoldersJson = await StorageService.getItem(this.UNIFIED_STORAGE_KEY);

      const oldFolders: Folder[] = oldFoldersJson ? JSON.parse(oldFoldersJson) : [];
      const unifiedFolders: Folder[] = unifiedFoldersJson ? JSON.parse(unifiedFoldersJson) : [];

      console.log('📁 Migration data:', {
        oldFoldersCount: oldFolders.length,
        unifiedFoldersCount: unifiedFolders.length
      });

      // Initialize reconciliation state
      const finalFolders: Folder[] = [];
      const folderIdMap = new Map<string, string>(); // old ID -> canonical ID
      const seenNamesInFinal = new Set<string>(); // case-insensitive names
      let foldersModified = false;
      let recordingsModified = false;

      // Process canonical folders first (from unified storage)
      for (const folder of unifiedFolders) {
        finalFolders.push(folder);
        seenNamesInFinal.add(folder.name.toLowerCase());
        folderIdMap.set(folder.id, folder.id); // Map to itself
      }

      // Process old folders (from legacy storage)
      for (const oldFolder of oldFolders) {
        // Skip if already processed from unified store
        if (folderIdMap.has(oldFolder.id)) {
          console.log('🔄 Skipping already processed folder:', oldFolder.name);
          continue;
        }

        let finalFolder = { ...oldFolder };
        
        // Check for name collision
        if (seenNamesInFinal.has(oldFolder.name.toLowerCase())) {
          const uniqueName = this.generateUniqueFolderName(oldFolder.name, seenNamesInFinal);
          const newId = this.generateUniqueId();
          
          console.log('🔄 Resolving name collision:', {
            originalName: oldFolder.name,
            uniqueName,
            originalId: oldFolder.id,
            newId
          });
          
          finalFolder = {
            ...oldFolder,
            id: newId,
            name: uniqueName,
          };
          
          folderIdMap.set(oldFolder.id, newId);
        } else {
          folderIdMap.set(oldFolder.id, oldFolder.id);
        }
        
        finalFolders.push(finalFolder);
        seenNamesInFinal.add(finalFolder.name.toLowerCase());
        foldersModified = true;
      }

      // Repoint recordings to use canonical folder IDs
      try {
        const allRecordings = await AudioStorageService.getAllFiles();
        console.log('🔄 Checking recordings for folder repointing:', allRecordings.length);
        
        for (const recording of allRecordings) {
          if (recording.folderId && folderIdMap.has(recording.folderId)) {
            const canonicalFolderId = folderIdMap.get(recording.folderId);
            
            if (canonicalFolderId !== recording.folderId) {
              console.log('🔄 Repointing recording:', {
                recordingName: recording.name,
                oldFolderId: recording.folderId,
                newFolderId: canonicalFolderId
              });
              
              await AudioStorageService.updateAudioFile(recording.id, { 
                folderId: canonicalFolderId 
              });
              recordingsModified = true;
            }
          }
        }
      } catch (recordingError) {
        console.error('❌ Error repointing recordings:', recordingError);
        // Continue with folder migration even if recording update fails
      }

      // Commit changes if any modifications were made
      if (foldersModified) {
        // Sort folders alphabetically before saving
        finalFolders.sort((a, b) => a.name.localeCompare(b.name));

        // Save merged folders to unified storage
        await this._saveAllFolders(finalFolders);

        // Remove old storage key
        await StorageService.removeItem(this.OLD_STORAGE_KEY);
      }

      // Mark migration as complete
      await StorageService.setItem(this.MIGRATION_COMPLETE_FLAG, 'true');

      // Emit event if any changes were made
      if (foldersModified || recordingsModified) {
        RecordingsStore.notifyStoreChanged(false, { 
          type: 'migration_complete',
          foldersModified,
          recordingsModified,
          folderCount: finalFolders.length
        });
      }

      console.log('✅ Folder migration completed:', {
        totalFolders: finalFolders.length,
        foldersModified,
        recordingsModified,
        folderNames: finalFolders.map(f => f.name)
      });

    } catch (error) {
      console.error('❌ Folder migration failed:', error);
      // Don't throw - allow app to continue with whatever data is available
    }
  }

  static async getAllFolders(): Promise<Folder[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.allFoldersCache && (now - this.allFoldersCache.timestamp) < this.CACHE_DURATION_MS) {
        console.log('🚀 FolderService: Using cached folders');
        return this.allFoldersCache.data;
      }
      
      console.log('🔄 FolderService: Cache miss, fetching fresh folders');
      
      // Perform migration before getting folders
      await this.performMigration();
      
      console.log('🔍 FolderService.getAllFolders: About to load from storage key:', this.UNIFIED_STORAGE_KEY);
      const foldersJson = await StorageService.getItem(this.UNIFIED_STORAGE_KEY);
      console.log('🔍 FolderService.getAllFolders: Raw storage data exists:', !!foldersJson);
      
      if (!foldersJson) return [];
      
      const folders: Folder[] = JSON.parse(foldersJson);
      console.log('🔍 FolderService.getAllFolders: Parsed folders:', folders.length, folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })));
      
      const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache the result
      this.allFoldersCache = {
        data: sortedFolders,
        timestamp: now,
      };
      
      return sortedFolders;
    } catch (error) {
      console.error('Failed to get folders:', error);
      return [];
    }
  }

  static async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    try {
      const trimmedName = name.trim();
      
      if (!trimmedName) {
        throw new Error('Folder name cannot be empty');
      }

      if (trimmedName.length > 32) {
        throw new Error('Folder name must be 32 characters or less');
      }

      // Validate depth limit (max depth = 2)
      if (parentId) {
        const parentFolder = await this.getFolderById(parentId);
        if (!parentFolder) {
          throw new Error('Parent folder not found');
        }
        
        // Use the new depth calculation method
        const parentDepth = await this.getFolderDepth(parentId);
        if (parentDepth >= 2) {
          throw new Error('Cannot create folders deeper than 2 levels');
        }
      }

      // Check for duplicates
      const existingFolders = await this.getAllFolders();
      const isDuplicate = existingFolders.some(folder =>
        folder.name.toLowerCase() === trimmedName.toLowerCase() &&
        folder.parentId === parentId
      );

      if (isDuplicate) {
        throw new Error('A folder with this name already exists in this location');
      }

      const newFolder: Folder = {
        id: this.generateUniqueId(),
        name: trimmedName,
        parentId: parentId || null,
        createdAt: Date.now(),
      };

      const updatedFolders = [...existingFolders, newFolder];
      await this._saveAllFolders(updatedFolders);
      
      console.log('✅ Folder created:', newFolder.name);
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  static async getFolderById(folderId: string): Promise<Folder | null> {
    try {
      const folders = await this.getAllFolders();
      return folders.find(f => f.id === folderId) || null;
    } catch (error) {
      console.error('Failed to get folder by ID:', error);
      return null;
    }
  }

  static async getFoldersByParentId(parentId: string | null): Promise<Folder[]> {
    try {
      const folders = await this.getAllFolders();
      // When looking for root folders (parentId === null), also include folders with undefined parentId
      const filteredFolders = folders.filter(f => {
        if (parentId === null) {
          // Root folders: parentId is null OR undefined
          return f.parentId === null || f.parentId === undefined;
        } else {
          // Child folders: exact parentId match
          return f.parentId === parentId;
        }
      });
      
      return filteredFolders.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to get folders by parent ID:', error);
      return [];
    }
  }

  static async getFolderPath(folderId: string | null): Promise<Folder[]> {
    if (!folderId) return [];
    
    try {
      const folders = await this.getAllFolders();
      const path: Folder[] = [];
      let currentId: string | null = folderId;
      
      while (currentId) {
        const folder = folders.find(f => f.id === currentId);
        if (!folder) break;
        
        path.unshift(folder);
        currentId = folder.parentId;
      }
      
      return path;
    } catch (error) {
      console.error('Failed to get folder path:', error);
      return [];
    }
  }

  static async getFolderDepth(folderId: string | null): Promise<number> {
    if (!folderId) return 0; // Root level has depth 0
    
    try {
      const folders = await this.getAllFolders();
      let depth = 0;
      let currentId: string | null = folderId;
      
      while (currentId) {
        const folder = folders.find(f => f.id === currentId);
        if (!folder) break;
        
        depth++;
        currentId = folder.parentId;
        
        // Safety check to prevent infinite loops
        if (depth > 10) {
          console.warn('Folder depth calculation exceeded safety limit, possible circular reference');
          break;
        }
      }
      
      return depth;
    } catch (error) {
      console.error('Failed to calculate folder depth:', error);
      return 0;
    }
  }
  static async deleteFolder(folderId: string): Promise<void> {
    try {
      const folders = await this.getAllFolders();
      const updatedFolders = folders.filter(f => f.id !== folderId);
      await this._saveAllFolders(updatedFolders);
      
      console.log('✅ Folder deleted:', folderId);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }

  static async renameFolder(folderId: string, newName: string): Promise<Folder> {
    try {
      const trimmedName = newName.trim();
      
      if (!trimmedName) {
        throw new Error('Folder name cannot be empty');
      }

      if (trimmedName.length > 32) {
        throw new Error('Folder name must be 32 characters or less');
      }

      const folders = await this.getAllFolders();
      const folderToRename = folders.find(f => f.id === folderId);
      
      if (!folderToRename) {
        throw new Error('Folder not found');
      }

      // Check for duplicates within the same parent (excluding current folder)
      const isDuplicate = folders.some(folder => 
        folder.id !== folderId && 
        folder.name.toLowerCase() === trimmedName.toLowerCase() &&
        folder.parentId === folderToRename.parentId
      );

      if (isDuplicate) {
        throw new Error('A folder with this name already exists in this location');
      }

      const updatedFolder: Folder = {
        ...folderToRename,
        name: trimmedName,
      };

      const updatedFolders = folders.map(f => 
        f.id === folderId ? updatedFolder : f
      );
      
      await this._saveAllFolders(updatedFolders);
      
      console.log('✅ Folder renamed:', updatedFolder.name);
      return updatedFolder;
    } catch (error) {
      console.error('Failed to rename folder:', error);
      throw error;
    }
  }
}