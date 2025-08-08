export class DateUtils {
  static getStartOfDay(date: Date): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay.getTime();
  }

  static getEndOfDay(date: Date): number {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime();
  }

  static getToday(): { startDate: number; endDate: number } {
    const today = new Date();
    return {
      startDate: this.getStartOfDay(today),
      endDate: this.getEndOfDay(today),
    };
  }

  static getYesterday(): { startDate: number; endDate: number } {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      startDate: this.getStartOfDay(yesterday),
      endDate: this.getEndOfDay(yesterday),
    };
  }

  static getLast7Days(): { startDate: number; endDate: number } {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // Include today
    return {
      startDate: this.getStartOfDay(sevenDaysAgo),
      endDate: this.getEndOfDay(today),
    };
  }

  static getThisMonth(): { startDate: number; endDate: number } {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      startDate: this.getStartOfDay(firstDay),
      endDate: this.getEndOfDay(lastDay),
    };
  }

  static formatDateRange(startDate: number, endDate: number): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Check if it's today
    if (this.isSameDay(start, today) && this.isSameDay(end, today)) {
      return 'Today';
    }
    
    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (this.isSameDay(start, yesterday) && this.isSameDay(end, yesterday)) {
      return 'Yesterday';
    }
    
    // Check if it's last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    if (this.isSameDay(start, sevenDaysAgo) && this.isSameDay(end, today)) {
      return 'Last 7 Days';
    }
    
    // Check if it's this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (this.isSameDay(start, firstDayOfMonth) && this.isSameDay(end, lastDayOfMonth)) {
      return 'This Month';
    }
    
    // Custom range formatting
    if (this.isSameDay(start, end)) {
      return start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Different days
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${startStr}–${endStr}`;
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  static isDateInRange(dateToCheck: string, startDate: number, endDate: number): boolean {
    const checkTime = new Date(dateToCheck).getTime();
    return checkTime >= startDate && checkTime <= endDate;
  }
}