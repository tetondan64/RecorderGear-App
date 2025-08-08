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

export interface FolderEvent {
  type: 'folders_changed';
  payload: {
    op: 'create' | 'rename' | 'move' | 'delete';
    id: string;
    parentId?: string | null;
    name?: string;
    timestamp: number;
    version: number;
  };
}