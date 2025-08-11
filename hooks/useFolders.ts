import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderEvent, FolderFilter } from '@/types/folder';
import { FoldersAdapter, FolderWithCounts } from '@/services/foldersAdapter';

export function useFolders() {
  const [folders, setFolders] = useState<FolderWithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FolderFilter>({
    folderId: null,
    folderName: null,
  });

  const adapter = FoldersAdapter.getInstance();

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allFolders = await adapter.listRoots();
      setFolders(allFolders);
    } catch (err) {
      setError('Failed to load folders');
      console.error('Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  const createFolder = useCallback(async (name: string) => {
    try {
      setError(null);
      
      const newFolder = await adapter.create(name);
      
      return newFolder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw err;
    }
  }, [adapter]);

  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      setError(null);
      
      await adapter.remove(folderId);
      
      // Clear filter if deleted folder was active
      if (activeFilter.folderId === folderId) {
        setActiveFilter({ folderId: null, folderName: null });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      throw err;
    }
  }, [adapter, activeFilter.folderId]);

  const setFolderFilter = useCallback((folder: Folder | null) => {
    if (folder) {
      setActiveFilter({
        folderId: folder.id,
        folderName: folder.name,
      });
    } else {
      setActiveFilter({
        folderId: null,
        folderName: null,
      });
    }
  }, []);

  const clearFilter = useCallback(() => {
    setActiveFilter({
      folderId: null,
      folderName: null,
    });
  }, []);

  // Subscribe to folder change events
  useEffect(() => {
    const unsubscribe = adapter.watch((event?: FolderEvent) => {
      console.log('🔄 useFolders: Received folder change event:', event);
      loadFolders();
    });
    
    return unsubscribe;
  }, [adapter, loadFolders]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders,
    loading,
    error,
    activeFilter,
    createFolder,
    deleteFolder,
    setFolderFilter,
    clearFilter,
    refreshFolders: loadFolders,
  };
}