import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder } from '@/types/folder';
import { FoldersAdapter, FolderEvent, FolderWithCounts } from '@/services/foldersAdapter';
import logger from '@/utils/logger';

interface OptimisticFolder extends Folder {
  tempId: string;
  pending: true;
  subfolderCount: number;
  recordingCount: number;
}

type FolderItem = FolderWithCounts | OptimisticFolder;

interface UseFolderChildrenResult {
  items: FolderItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addOptimisticFolder: (name: string) => string;
  replaceOptimisticFolder: (tempId: string, realFolder: FolderWithCounts) => void;
  removeOptimisticFolder: (tempId: string) => void;
}

export function useFolderChildren(parentId: string | null): UseFolderChildrenResult {
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const adapter = FoldersAdapter.getInstance();
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const generateTempId = (): string => {
    return `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const normalizeString = (str: string): string => {
    return str.trim().toLowerCase();
  };

  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.log('🔄 useFolderChildren: Refetching folders for parentId:', parentId);
      }
      
      const foldersWithCounts = await adapter.listChildren(parentId);
      
      if (!isMountedRef.current) return;
      
      // Reconcile with optimistic items
      setItems(prevItems => {
        const optimisticItems = prevItems.filter(item => 'pending' in item && item.pending);
        const realFolders = foldersWithCounts;
        
        // Remove optimistic items that now exist as real folders
        const reconciledOptimistic = optimisticItems.filter(optimistic => {
          const matchingReal = realFolders.find(real => 
            normalizeString(real.name) === normalizeString(optimistic.name)
          );
          
          if (matchingReal) {
            if (process.env.NODE_ENV !== 'production') {
              logger.log('🔄 useFolderChildren: Auto-reconciling optimistic folder:', optimistic.tempId, '→', matchingReal.id);
            }
            return false; // Remove optimistic item
          }
          
          return true; // Keep optimistic item
        });
        
        // Combine real folders with remaining optimistic items
        const combinedItems = [...realFolders, ...reconciledOptimistic];
        
        // Sort alphabetically
        return combinedItems.sort((a, b) => a.name.localeCompare(b.name));
      });
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load folders';
      setError(errorMessage);
      logger.error('useFolderChildren: Error loading folders:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [parentId, adapter]);

  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    
    refetchTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 50); // 50ms debounce
  }, [refetch]);

  const addOptimisticFolder = useCallback((name: string): string => {
    const tempId = generateTempId();
    const optimisticFolder: OptimisticFolder = {
      id: '', // Will be set when persisted
      tempId,
      name: name.trim(),
      parentId,
      createdAt: Date.now(),
      pending: true,
      subfolderCount: 0,
      recordingCount: 0,
    };
    
    if (process.env.NODE_ENV !== 'production') {
      logger.log('optimistic:add', { tempId, name: name.trim(), parentId });
    }
    
    setItems(prev => {
      const newItems = [...prev, optimisticFolder];
      return newItems.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return tempId;
  }, [parentId]);

  const replaceOptimisticFolder = useCallback((tempId: string, realFolder: FolderWithCounts) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log('optimistic:replace', { tempId, realId: realFolder.id, name: realFolder.name });
    }
    
    setItems(prev => {
      const newItems = prev.map(item => {
        if ('tempId' in item && item.tempId === tempId) {
          // Replace optimistic with real folder
          return realFolder;
        }
        return item;
      });
      
      return newItems.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const removeOptimisticFolder = useCallback((tempId: string) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log('optimistic:remove', { tempId });
    }
    
    setItems(prev => prev.filter(item => 
      !('tempId' in item) || item.tempId !== tempId
    ));
  }, []);

  // Add items to dependency array for handleFolderEvent
  // This is crucial for the optimisticItem lookup within the event handler
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleFolderEvent = useCallback((event?: FolderEvent) => {
    if (!event) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log('🔄 useFolderChildren: Generic folder change event, refetching');
      }
      debouncedRefetch();
      return;
    }

    // Handle local reconcile event
    if (event.type === 'folders_local_reconcile' && event.payload.tempId && event.payload.real) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log('local:reconcile', { tempId: event.payload.tempId, realId: event.payload.real.id });
      }
      // Use the explicit replaceOptimisticFolder for local reconciliation
      replaceOptimisticFolder(event.payload.tempId, event.payload.real as FolderWithCounts);
      return; // Handled, no further action for this event
    }

    const { op, id, parentId: eventParentId } = event.payload;
    
    if (process.env.NODE_ENV !== 'production') {
      logger.log('events:create', { op, id, eventParentId, currentParentId: parentId });
    }

    // Check if this event affects our current parent
    const affectsCurrentParent = 
      eventParentId === parentId || // Direct child operation
      (op === 'move' && items.some(item => 'id' in item && item.id === id)); // Moving away from current parent

    if (affectsCurrentParent) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log('🎯 useFolderChildren: Event affects current parent');
      }
      
      // For create operations, try to reconcile with optimistic folders
      if (op === 'create' && eventParentId === parentId) {
        // Find matching optimistic folder by name
        const optimisticItem = items.find(item => 
          'pending' in item && 
          item.pending && 
          normalizeString(item.name) === normalizeString(event.payload.name || '')
        );
        
        if (optimisticItem && 'tempId' in optimisticItem) {
          if (process.env.NODE_ENV !== 'production') {
            logger.log('🔄 useFolderChildren: Found matching optimistic folder for reconciliation:', optimisticItem.tempId);
          }
          
          // We need to fetch the real folder data to get counts
          // For now, trigger a refetch which will handle reconciliation
          debouncedRefetch();
          return;
        }
      }
      
      debouncedRefetch();
    }
  }, [parentId, items, debouncedRefetch, replaceOptimisticFolder]);

  // Subscribe to folder events
  useEffect(() => {
    const unsubscribe = adapter.watch(handleFolderEvent);
    return unsubscribe;
  }, [adapter, handleFolderEvent]);

  // Load initial data
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    items,
    loading,
    error,
    refetch,
    addOptimisticFolder,
    replaceOptimisticFolder,
    removeOptimisticFolder,
  };
}