export interface DateRange {
  startDate: number | null;
  endDate: number | null;
}

export interface DateFilter {
  dateRange: DateRange;
  displayText: string | null;
}

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'thismonth' | 'custom';