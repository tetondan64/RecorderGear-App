import { useState, useCallback } from 'react';
import { DateRange, DateFilter } from '@/types/dateFilter';
import { DateUtils } from '@/utils/dateUtils';

export function useDateFilter() {
  const [activeFilter, setActiveFilter] = useState<DateFilter>({
    dateRange: { startDate: null, endDate: null },
    displayText: null,
  });

  const setDateFilter = useCallback((dateRange: DateRange, displayText: string) => {
    setActiveFilter({
      dateRange,
      displayText,
    });
  }, []);

  const clearDateFilter = useCallback(() => {
    setActiveFilter({
      dateRange: { startDate: null, endDate: null },
      displayText: null,
    });
  }, []);

  const isDateInFilter = useCallback((dateString: string): boolean => {
    const { startDate, endDate } = activeFilter.dateRange;
    
    if (!startDate || !endDate) {
      return true; // No filter applied
    }
    
    return DateUtils.isDateInRange(dateString, startDate, endDate);
  }, [activeFilter.dateRange]);

  const hasActiveFilter = activeFilter.dateRange.startDate !== null && 
                         activeFilter.dateRange.endDate !== null;

  return {
    activeFilter,
    hasActiveFilter,
    setDateFilter,
    clearDateFilter,
    isDateInFilter,
  };
}