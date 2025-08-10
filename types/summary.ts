export type SummaryStyle = {
  id: string;           // uuid
  title: string;        // shown in pickers
  subtitle: string;     // shown in pickers
  prompt: string;       // the AI instructions
  updatedAt: number;    // epoch ms
  builtIn?: boolean;    // default styles; still editable/deletable
};

export type SavedSummary = {
  styleId: string;
  styleTitle: string;
  contentMd: string;    // markdown result
  createdAt: number;    // epoch ms
};
