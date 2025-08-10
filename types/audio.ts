export interface AudioFile {
  id: string;
  name: string;
  uri: string;
  duration?: number;
  fileSize: number;
  importDate: string;
  mimeType?: string;
  hasTranscript?: boolean;
  hasSummary?: boolean;
  summaryStyleId?: string;
  base64Data?: string; // For web platform persistence
  folderId?: string; // For folder organization
  tags?: string[]; // Array of tag IDs
}

export interface AudioFileMetadata {
  id: string;
  name: string;
  duration?: number;
  fileSize: number;
  importDate: string;
  mimeType?: string;
  hasTranscript?: boolean;
  base64Data?: string; // For web platform persistence
  folderId?: string; // For folder organization
  tags?: string[]; // Array of tag IDs
}