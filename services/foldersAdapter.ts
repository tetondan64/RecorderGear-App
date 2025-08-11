import { Folder } from '@/types/folder';
import { RecordingsStore } from '@/data/recordingsStore';
import { FolderService } from '@/services/folderService';
import logger from '@/utils/logger';

export interface FolderEvent {
  type: 'folders_changed';
  payload: {
    op: 'create' | 'rename' | 'move' | 'delete';
    id: string;
    parentId?: string | null;
    timestamp: number;
    version: number;
  };
}

export interface FolderWithCounts extends Folder {
  subfolderCount: number;
  recordingCount: number;
  isReadOnlyDueToDepth?: boolean;
}

type FolderChangeListener = (event?: FolderEvent) => void;

/**
 * FoldersAdapter - Single source of truth for all folder operations
 * Provides a unified API for folder management with live event synchronization
 */
export class FoldersAdapter {
  private static instance: FoldersAdapter;
  private listeners: FolderChangeListener[] = [];
  private version = 0;
  
  // Cache for performance with 5-second TTL
  private static readonly CACHE_DURATION_MS = 5000;
  private allFoldersCache: { data: Folder[]; timestamp: number } | null = null;
  private validMoveTargetsCache: { data: Folder[]; timestamp: number } | null = null;

  static getInstance(): FoldersAdapter {
    if (!FoldersAdapter.instance) {
      FoldersAdapter.instance = new FoldersAdapter();
    }
    return FoldersAdapter.instance;
  }

  private constructor() {
    // Subscribe to store changes to relay events
    RecordingsStore.addStoreChangeListener(() => {
      this.invalidateCache();
    });
    
    RecordingsStore.addStoreChangeListenerWithEvent((event?: FolderEvent) => {
      this.notifyListeners(event);
    });
  }

  private invalidateCache(): void {
    logger.log('🗑️ FoldersAdapter: Invalidating all caches');
    this.allFoldersCache = null;
    this.validMoveTargetsCache = null;
  }

  private notifyListeners(event?: FolderEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private emitEvent(op: FolderEvent['payload']['op'], id: string, parentId?: string | null): void {
    // Get folder name for reconciliation
    const folderName = this.allFoldersCache?.data.find(f => f.id === id)?.name || '';
    
    this.version++;
    const event: FolderEvent = {
      type: 'folders_changed',
      payload: {
        op,
        id,
        parentId,
        name: folderName,
        timestamp: Date.now(),
        version: this.version,
      },
    };
    
    logger.log('📡 FoldersAdapter emitting event:', event);
    
    // Notify RecordingsStore to trigger cross-tab sync and other listeners
    RecordingsStore.notifyStoreChanged(false, event);
  }

  /**
   * Subscribe to folder change events
   */
  watch(callback: FolderChangeListener): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * List root folders (depth 0)
   */
  async listRoots(): Promise<FolderWithCounts[]> {
    return this.listChildren(null);
  }

  /**
   * List child folders of a given parent
   */
  async listChildren(parentId: string | null): Promise<FolderWithCounts[]> {
    try {
      logger.log('🔍 FoldersAdapter.listChildren called with parentId:', parentId);
      return await RecordingsStore.getFoldersWithCounts(parentId);
    } catch (error) {
      logger.error('Failed to list folder children:', error);
      return [];
    }
  }

  /**
   * Create a new folder
   */
  async create(name: string, parentId?: string | null): Promise<Folder> {
    try {
      const newFolder = await RecordingsStore.createFolder(name, parentId);
      
      // Invalidate cache to ensure fresh data
      this.invalidateCache();
      
      this.emitEvent('create', newFolder.id, parentId);
      return newFolder;
    } catch (error) {
      logger.error('Failed to create folder:', error);
      throw error;
    }
  }

  /**
   * Rename a folder
   */
  async rename(id: string, name: string): Promise<Folder> {
    try {
      const renamedFolder = await RecordingsStore.renameFolder(id, name);
      this.emitEvent('rename', id, renamedFolder.parentId);
      return renamedFolder;
    } catch (error) {
      logger.error('Failed to rename folder:', error);
      throw error;
    }
  }

  /**
   * Move a folder to a new parent
   */
  async move(id: string, newParentId: string | null): Promise<Folder> {
    try {
      const movedFolder = await RecordingsStore.moveFolder(id, newParentId);
      this.emitEvent('move', id, newParentId);
      return movedFolder;
    } catch (error) {
      logger.error('Failed to move folder:', error);
      throw error;
    }
  }

  /**
   * Remove a folder (cascade delete handled internally)
   */
  async remove(id: string): Promise<void> {
    try {
      // Get folder info before deletion for event
      const folder = await FolderService.getFolderById(id);
      const parentId = folder?.parentId || null;
      
      await RecordingsStore.deleteFolder(id);
      this.emitEvent('delete', id, parentId);
    } catch (error) {
      logger.error('Failed to remove folder:', error);
      throw error;
    }
  }

  /**
   * Get the full path of a folder
   */
  async getPath(id: string | null): Promise<Folder[]> {
    try {
      return await RecordingsStore.getFolderPath(id);
    } catch (error) {
      logger.error('Failed to get folder path:', error);
      return [];
    }
  }

  /**
   * Get the depth of a folder
   */
  async getDepth(id: string | null): Promise<number> {
    try {
      return await FolderService.getFolderDepth(id);
    } catch (error) {
      logger.error('Failed to get folder depth:', error);
      return 0;
    }
  }

  /**
   * Check if a folder name exists in a given parent
   */
  async existsInParent(name: string, parentId: string | null): Promise<boolean> {
    try {
      const siblings = await this.listChildren(parentId);
      return siblings.some(folder => 
        folder.name.toLowerCase() === name.toLowerCase()
      );
    } catch (error) {
      logger.error('Failed to check folder existence:', error);
      return false;
    }
  }

  /**
   * Get all folders (for compatibility with existing code)
   */
  async getAllFolders(): Promise<Folder[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.allFoldersCache && (now - this.allFoldersCache.timestamp) < FoldersAdapter.CACHE_DURATION_MS) {
        logger.log('🚀 FoldersAdapter: Using cached all folders');
        return this.allFoldersCache.data;
      }
      
      logger.log('🔄 FoldersAdapter: Cache miss, fetching fresh all folders');
      const folders = await RecordingsStore.getFolders();
      
      // Cache the result
      this.allFoldersCache = {
        data: folders,
        timestamp: now,
      };
      
      return folders;
    } catch (error) {
      logger.error('Failed to get all folders:', error);
      return [];
    }
  }

  /**
   * Get recordings in a folder (for File Explorer compatibility)
   */
  async getRecordingsInFolder(folderId: string | null): Promise<any[]> {
    try {
      return await RecordingsStore.getRecordingsInFolder(folderId);
    } catch (error) {
      logger.error('Failed to get recordings in folder:', error);
      return [];
    }
  }

  /**
   * Get valid move targets for recordings (depth <= 1)
   */
  async getValidMoveTargets(): Promise<Folder[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.validMoveTargetsCache && (now - this.validMoveTargetsCache.timestamp) < FoldersAdapter.CACHE_DURATION_MS) {
        logger.log('🚀 FoldersAdapter: Using cached valid move targets');
        return this.validMoveTargetsCache.data;
      }
      
      logger.log('🔄 FoldersAdapter: Cache miss, fetching fresh valid move targets');
      const allFolders = await this.getAllFolders();
      const validTargets: Folder[] = [];
      
      for (const folder of allFolders) {
        const depth = await this.getDepth(folder.id);
        if (depth <= 1) {
          validTargets.push(folder);
        }
      }
      
      const sortedTargets = validTargets.sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache the result
      this.validMoveTargetsCache = {
        data: sortedTargets,
        timestamp: now,
      };
      
      return sortedTargets;
    } catch (error) {
      logger.error('Failed to get valid move targets:', error);
      return [];
    }
  }
}

export { FoldersAdapter }