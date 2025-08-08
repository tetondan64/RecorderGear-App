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