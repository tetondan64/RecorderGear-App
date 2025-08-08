import React, { createContext, useContext, ReactNode } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder } from '@/types/folder';
import { FoldersAdapter, FolderEvent, FolderWithCounts } from '@/services/foldersAdapter';

interface OptimisticFolder extends Folder {
  tempId: string;
  pending: true;
  subfolderCount: number;
  recordingCount: number;
}

type FolderItem = FolderWithCounts | OptimisticFolder;

interface FolderExplorerContextType {
  parentId: string | null;
  items: FolderItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addOptimisticFolder: (name: string) => string;
  replaceOptimisticFolder: (tempId: string, realFolder: any) => void;
  removeOptimisticFolder: (tempId: string) => void;
}

const FolderExplorerContext = createContext<FolderExplorerContextType | null>(null);

interface FolderExplorerProviderProps {
  parentId: string | null;
  children: ReactNode;
}

export function FolderExplorerProvider({ parentId, children }: FolderExplorerProviderProps) {
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
      
      console.log('🔄 FolderExplorerProvider: Refetching folders for parentId:', parentId);
      
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
            console.log('🔄 FolderExplorerProvider: Auto-reconciling optimistic folder:', optimistic.tempId, '→', matchingReal.id);
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
      console.error('FolderExplorerProvider: Error loading folders:', err);
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
    
    console.log('optimistic:add', { tempId, name: name.trim(), parentId });
    
    setItems(prev => {
      const newItems = [...prev, optimisticFolder];
      return newItems.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return tempId;
  }, [parentId]);

  const replaceOptimisticFolder = useCallback((tempId: string, realFolder: FolderWithCounts) => {
    console.log('local:reconcile', { tempId, realId: realFolder.id, name: realFolder.name });
    
    setItems(prev => {
      const index = prev.findIndex(item => 'tempId' in item && item.tempId === tempId);
      if (index < 0) return prev;
      
      const newItems = [...prev];
      newItems.splice(index, 1); // Remove temp
      newItems.splice(index, 0, { ...realFolder, pending: false }); // Insert real at same position
      
      return newItems.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const removeOptimisticFolder = useCallback((tempId: string) => {
    console.log('optimistic:remove', { tempId });
    
    setItems(prev => prev.filter(item => 
      !('tempId' in item) || item.tempId !== tempId
    ));
  }, []);

  const handleFolderEvent = useCallback((event?: FolderEvent) => {
    if (!event) {
      console.log('🔄 FolderExplorerProvider: Generic folder change event, refetching');
      debouncedRefetch();
      return;
    }

    // Handle local reconcile event
    if (event.type === 'folders_local_reconcile' && event.payload.tempId && event.payload.real) {
      console.log('local:reconcile', { tempId: event.payload.tempId, realId: event.payload.real.id });
      replaceOptimisticFolder(event.payload.tempId, event.payload.real as FolderWithCounts);
      return;
    }

    const { op, id, parentId: eventParentId } = event.payload;
    
    console.log('events:create', { op, id, eventParentId, currentParentId: parentId });

    // Check if this event affects our current parent
    const affectsCurrentParent = 
      eventParentId === parentId || // Direct child operation
      (op === 'move' && items.some(item => 'id' in item && item.id === id)); // Moving away from current parent

    if (affectsCurrentParent) {
      console.log('🎯 FolderExplorerProvider: Event affects current parent');
      
      // For create operations, try to reconcile with optimistic folders
      if (op === 'create' && eventParentId === parentId) {
        // Find matching optimistic folder by name
        const optimisticItem = items.find(item => 
          'pending' in item && 
          item.pending && 
          normalizeString(item.name) === normalizeString(event.payload.name || '')
        );
        
        if (optimisticItem && 'tempId' in optimisticItem) {
          console.log('🔄 FolderExplorerProvider: Found matching optimistic folder for reconciliation:', optimisticItem.tempId);
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

  // Load initial data when parentId changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Reset state when parentId changes
  useEffect(() => {
    setItems([]);
    setLoading(true);
    setError(null);
  }, [parentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: FolderExplorerContextType = {
    parentId,
    items,
    loading,
    error,
    refetch,
    addOptimisticFolder,
    replaceOptimisticFolder,
    removeOptimisticFolder,
  };

  return (
    <FolderExplorerContext.Provider value={contextValue}>
      {children}
    </FolderExplorerContext.Provider>
  );
}

export function useFolderExplorer(): FolderExplorerContextType {
  const context = useContext(FolderExplorerContext);
  
  if (!context) {
    throw new Error('useFolderExplorer must be used within a FolderExplorerProvider');
  }
  
  return context;
}