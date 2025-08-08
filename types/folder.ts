export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: number;
  isReadOnlyDueToDepth?: boolean;
}

export interface FolderFilter {
  folderId: string | null;
  folderName: string | null;
}