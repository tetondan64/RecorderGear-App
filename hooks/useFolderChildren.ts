import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder } from '@/types/folder';
import { FoldersAdapter, FolderEvent, FolderWithCounts } from '@/services/foldersAdapter';

interface OptimisticFolder extends Folder {
  tempId: string;
  pending: true;
}

interface UseFolderChildrenResult {
  folders: (FolderWithCounts | OptimisticFolder)[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addOptimisticFolder: (name: string) => string;
  removeOptimisticFolder: (tempId: string) => void;
}

export function useFolderChildren(parentId: string | null): UseFolderChildrenResult {
  const [persistedFolders, setPersistedFolders] = useState<FolderWithCounts[]>([]);
  const [optimisticFolders, setOptimisticFolders] = useState<OptimisticFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const adapter = FoldersAdapter.getInstance();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tempIdToFinalIdMap = useRef<Map<string, string>>(new Map());

  const generateTempId = (): string => {
    return `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 useFolderChildren: Refreshing folders for parentId:', parentId);
      const foldersWithCounts = await adapter.listChildren(parentId);
      console.log('🔄 useFolderChildren: Loaded folders:', foldersWithCounts.length);
      
      setPersistedFolders(foldersWithCounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load folders';
      setError(errorMessage);
      console.error('useFolderChildren: Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  }, [parentId, adapter]);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      refresh();
    }, 50); // 50ms debounce
  }, [refresh]);

  const addOptimisticFolder = useCallback((name: string): string => {
    const tempId = generateTempId();
    const optimisticFolder: OptimisticFolder = {
      id: '', // Will be set when persisted
      tempId,
      name: name.trim(),
      parentId,
      createdAt: Date.now(),
      pending: true,
    };
    
    console.log('➕ useFolderChildren: Adding optimistic folder:', { tempId, name, parentId });
    setOptimisticFolders(prev => [...prev, optimisticFolder]);
    
    return tempId;
  }, [parentId]);

  const removeOptimisticFolder = useCallback((tempId: string) => {
    console.log('➖ useFolderChildren: Removing optimistic folder:', tempId);
    setOptimisticFolders(prev => prev.filter(f => f.tempId !== tempId));
    tempIdToFinalIdMap.current.delete(tempId);
  }, []);

  const handleFolderEvent = useCallback((event?: FolderEvent) => {
    if (!event) {
      console.log('🔄 useFolderChildren: Generic folder change event, refreshing');
      debouncedRefresh();
      return;
    }

    const { op, id, parentId: eventParentId } = event.payload;
    console.log('📡 useFolderChildren: Received folder event:', { op, id, eventParentId, currentParentId: parentId });

    // Check if this event affects our current parent
    const affectsCurrentParent = 
      eventParentId === parentId || // Direct child operation
      (op === 'move' && persistedFolders.some(f => f.id === id)); // Moving away from current parent

    if (affectsCurrentParent) {
      console.log('🎯 useFolderChildren: Event affects current parent, refreshing');
      
      // Reconciliation: If this is a create event and we have an optimistic folder with the same name
      if (op === 'create') {
        const matchingOptimistic = optimisticFolders.find(opt => 
          opt.parentId === eventParentId && 
          persistedFolders.some(persisted => persisted.name === opt.name)
        );
        
        if (matchingOptimistic) {
          console.log('🔄 useFolderChildren: Reconciling optimistic folder:', matchingOptimistic.tempId, '→', id);
          tempIdToFinalIdMap.current.set(matchingOptimistic.tempId, id);
          removeOptimisticFolder(matchingOptimistic.tempId);
        }
      }
      
      debouncedRefresh();
    }
  }, [parentId, persistedFolders, optimisticFolders, debouncedRefresh, removeOptimisticFolder]);

  // Subscribe to folder events
  useEffect(() => {
    const unsubscribe = adapter.watch(handleFolderEvent);
    return unsubscribe;
  }, [adapter, handleFolderEvent]);

  // Load initial data
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Combine persisted and optimistic folders
  const combinedFolders = [...persistedFolders, ...optimisticFolders];

  return {
    folders: combinedFolders,
    loading,
    error,
    refresh,
    addOptimisticFolder,
    removeOptimisticFolder,
  };
}