
export interface SummaryStyle {
  id: string;
  title: string;
  subtitle: string;
  instructions: string;  // AI prompt for generating summary
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AudioSummary {
  id: string;
  fileId: string;
  summaryStyleId: string;
  content: string;       // Generated summary content
  createdAt: string;
}

export interface SummaryGenerationRequest {
  transcriptText: string;
  instructions: string;
  fileId: string;
}
