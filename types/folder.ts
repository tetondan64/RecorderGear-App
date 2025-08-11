import { StoreEvent } from './store';

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: number;
  isReadOnlyDueToDepth?: boolean;
  tempId?: string;
  pending?: boolean;
}

export interface FolderFilter {
  folderId: string | null;
  folderName: string | null;
}

export interface FolderEvent extends StoreEvent {
  type: 'folders_changed' | 'folders_local_reconcile';
  payload: {
    op?: 'create' | 'rename' | 'move' | 'delete'; // Made optional for local_reconcile
    id?: string; // Made optional for local_reconcile
    parentId?: string | null;
    name?: string; // Made optional for local_reconcile
    timestamp: number;
    version?: number; // Made optional as local_reconcile might not have it
    tempId?: string; // New field for folders_local_reconcile
    real?: Folder; // New field for folders_local_reconcile
  };
}
