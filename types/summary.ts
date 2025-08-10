export interface SummaryStyle {
  id: string;
  name: string;
  description: string;
}

export interface SavedSummary {
  id: string;
  fileId: string;
  styleId: string;
  content: string;
  createdAt: number;
}
