export interface SummaryStyle {
  id: string;
  name: string;
  prompt: string;
  updatedAt: number;
  builtIn: boolean;
}

export interface SavedSummary {
  id: string;
  fileId: string;
  styleId: string;
  content: string;
  createdAt: number;
}

export interface SummaryStylesChangedEvent {
  reason: 'seed' | 'create' | 'update' | 'remove';
  style?: SummaryStyle;
}
