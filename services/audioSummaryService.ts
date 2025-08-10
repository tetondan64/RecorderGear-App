
import { AudioSummary } from '@/types/summary';
import { StorageService } from './storageService';

export class AudioSummaryService {
  // Debug utility to check storage state
  static async debugStorage(fileId: string): Promise<void> {
    try {
      const key = `summary-${fileId}`;
      console.log('🔍 Debug summary storage check for fileId:', fileId);
      console.log('🔑 Debug key:', key);
      
      const value = await StorageService.getItem(key);
      console.log('🔍 Debug retrieved value exists:', value !== null);
      console.log('🔍 Debug retrieved value preview:', 
        value ? value.substring(0, 200) + '...' : 'null'
      );
      
      // Show all keys for comparison
      const allKeys = await StorageService.getAllKeys();
      console.log('🔍 All storage keys:', allKeys);
      
      // Filter to summary keys only
      const summaryKeys = allKeys.filter(k => k.startsWith('summary-'));
      console.log('🔍 Summary keys only:', summaryKeys);
      
    } catch (error) {
      console.error('❌ Debug storage failed:', error);
    }
  }

  static async storeSummaryWithVerification(fileId: string, data: AudioSummary): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 200;
    
    // 📦 Log what we're storing before save
    console.log('📦 Storing audio summary:');
    console.log('📦 File ID:', fileId);
    console.log('📦 Data type:', typeof data);
    console.log('📦 Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'Not an object');
    
    if (data && typeof data === 'object') {
      console.log('📦 Summary validation before store:');
      console.log('  - Has id:', !!data.id);
      console.log('  - Has fileId:', !!data.fileId);
      console.log('  - Has content:', !!data.content);
      console.log('  - Content type:', typeof data.content);
      console.log('  - Content length:', typeof data.content === 'string' ? data.content.length : 'Not a string');
      console.log('  - Has summaryStyleId:', !!data.summaryStyleId);
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Storage attempt ${attempt}/${maxRetries} for summary:`, fileId);
        console.log('📌 Exact storage key:', `summary-${fileId}`);
        console.log('💾 Data being stored:', {
          type: typeof data,
          keys: data && typeof data === 'object' ? Object.keys(data) : 'Not an object',
          contentLength: data && data.content && typeof data.content === 'string' ? data.content.length : 'No valid content'
        });
        
        // Store the summary
        await StorageService.setItem(`summary-${fileId}`, JSON.stringify(data));
        console.log(`✅ AsyncStorage.setItem completed for attempt ${attempt}`);
        
        // Small delay to ensure storage is committed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify storage immediately
        console.log(`🔍 Verifying storage for attempt ${attempt}...`);
        console.log('📌 Verification key:', `summary-${fileId}`);
        
        const storedValue = await StorageService.getItem(`summary-${fileId}`);
        const exists = storedValue !== null;
        
        console.log(`🔍 Verification result for attempt ${attempt}:`, {
          exists,
          storedValueType: typeof storedValue,
          storedValueLength: storedValue && typeof storedValue === 'string' ? storedValue.length : 'Not a string'
        });
        
        if (exists) {
          console.log(`✅ Storage verification successful on attempt ${attempt}`);
          return true;
        } else {
          console.warn(`⚠️ Storage verification failed on attempt ${attempt} - stored value is null`);
          
          if (attempt < maxRetries) {
            console.log(`🔁 Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
        
      } catch (error) {
        console.error(`❌ Storage attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          console.log(`🔁 Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error(`❌ All ${maxRetries} storage attempts failed`);
          return false;
        }
      }
    }
    
    console.error(`❌ Storage verification failed after ${maxRetries} attempts`);
    return false;
  }

  static async saveSummary(summary: AudioSummary): Promise<void> {
    try {
      console.log('🔍 saveSummary called:', {
        summaryId: summary?.id,
        fileId: summary?.fileId,
        styleId: summary?.summaryStyleId
      });
      
      const stored = await this.storeSummaryWithVerification(summary.fileId, summary);
      if (!stored) {
        throw new Error('Failed to store summary after multiple attempts');
      }
      
      console.log('✅ Summary saved successfully for fileId:', summary.fileId);
    } catch (error) {
      console.error('❌ Error saving summary:', error);
      throw error;
    }
  }

  static async getSummaryByFileId(fileId: string): Promise<AudioSummary | null> {
    console.log('🔍 getSummaryByFileId called with fileId:', fileId);
    console.log('🔑 Will use storage key:', `summary-${fileId}`);
    
    try {
      const storageKey = `summary-${fileId}`;
      console.log('🔍 Attempting to retrieve with key:', storageKey);
      
      const storedValue = await StorageService.getItem(storageKey);
      console.log('🔍 Retrieved value exists:', storedValue !== null);
      
      if (!storedValue) {
        console.log('❌ No stored value found for key:', storageKey);
        
        // Debug: show all keys for comparison
        const allKeys = await StorageService.getAllKeys();
        console.log('🔍 All storage keys:', allKeys);
        
        const summaryKeys = allKeys.filter(k => k.startsWith('summary-'));
        console.log('🔍 Summary keys only:', summaryKeys);
        
        return null;
      }
      
      // 📤 Log what we retrieved after successful fetch
      console.log('📤 Retrieved summary from storage:');
      console.log('📤 Storage key used:', storageKey);
      console.log('📤 Raw stored value length:', typeof storedValue === 'string' ? storedValue.length : 'Not a string');
      
      console.log('✅ Found stored summary, parsing...');
      const summary = JSON.parse(storedValue);
      
      // 📤 Validate retrieved summary structure
      console.log('📤 Retrieved summary validation:');
      console.log('  - Has id:', !!summary?.id);
      console.log('  - Has fileId:', !!summary?.fileId);
      console.log('  - Has content:', !!summary?.content);
      console.log('  - Content type:', typeof summary?.content);
      console.log('  - Has summaryStyleId:', !!summary?.summaryStyleId);
      
      if (typeof summary?.content === 'string') {
        console.log('  - Content length:', summary.content.length);
        console.log('  - Content preview:', summary.content.substring(0, 100) + '...');
      }
      
      console.log('✅ Summary parsed successfully:', {
        id: summary?.id,
        fileId: summary?.fileId,
        summaryStyleId: summary?.summaryStyleId,
        hasContent: typeof summary?.content === 'string',
        contentLength: typeof summary?.content === 'string' ? summary.content.length : 0
      });
      
      return summary;
    } catch (error) {
      console.error('❌ Error getting summary by file ID:', error);
      return null;
    }
  }

  static async createSummary(
    fileId: string,
    summaryStyleId: string,
    content: string
  ): Promise<AudioSummary> {
    try {
      console.log('🔍 createSummary called:', {
        fileId,
        summaryStyleId,
        contentLength: typeof content === 'string' ? content.length : 'Not a string'
      });
      
      const summary: AudioSummary = {
        id: `summary_${fileId}_${Date.now()}`,
        fileId,
        summaryStyleId,
        content: typeof content === 'string' ? content : '',
        createdAt: new Date().toISOString()
      };
      
      await this.saveSummary(summary);
      
      console.log('✅ Summary created successfully:', summary.id);
      return summary;
    } catch (error) {
      console.error('❌ Error creating summary:', error);
      throw error;
    }
  }

  static async updateSummary(
    fileId: string,
    summaryStyleId: string,
    content: string
  ): Promise<AudioSummary> {
    try {
      console.log('🔍 updateSummary called:', {
        fileId,
        summaryStyleId,
        contentLength: typeof content === 'string' ? content.length : 'Not a string'
      });
      
      // This overwrites any existing summary for this file (one summary per file)
      const summary: AudioSummary = {
        id: `summary_${fileId}_${Date.now()}`,
        fileId,
        summaryStyleId,
        content: typeof content === 'string' ? content : '',
        createdAt: new Date().toISOString()
      };
      
      await this.saveSummary(summary);
      
      console.log('✅ Summary updated successfully:', summary.id);
      return summary;
    } catch (error) {
      console.error('❌ Error updating summary:', error);
      throw error;
    }
  }

  static async deleteSummary(fileId: string): Promise<void> {
    console.log('🗑️ deleteSummary called for fileId:', fileId);
    
    try {
      const storageKey = `summary-${fileId}`;
      console.log('🔑 Deleting summary with key:', storageKey);
      
      await StorageService.removeItem(storageKey);
      console.log('✅ Summary deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting summary:', error);
      throw new Error('Failed to delete summary');
    }
  }

  static async hasSummary(fileId: string): Promise<boolean> {
    console.log('🔍 hasSummary called for fileId:', fileId);
    
    try {
      const storageKey = `summary-${fileId}`;
      console.log('🔑 hasSummary storage key:', storageKey);
      
      const stored = await StorageService.getItem(storageKey);
      const exists = stored !== null;
      console.log(`🔍 hasSummary result: ${fileId} = ${exists}`);
      
      if (!exists) {
        // Debug: show what keys do exist
        const allKeys = await StorageService.getAllKeys();
        const summaryKeys = allKeys.filter(k => k.startsWith('summary-'));
        console.log('🔍 hasSummary - available summary keys:', summaryKeys);
      }
      
      return exists;
    } catch (error) {
      console.error('❌ hasSummary failed for fileId:', fileId, 'Error:', error);
      return false;
    }
  }

  static async getAllSummaries(): Promise<AudioSummary[]> {
    try {
      console.log('🔍 getAllSummaries called');
      
      const allKeys = await StorageService.getAllKeys();
      const summaryKeys = allKeys.filter(k => k.startsWith('summary-'));
      
      console.log('🔍 Found summary keys:', summaryKeys.length);
      
      const summaries: AudioSummary[] = [];
      
      for (const key of summaryKeys) {
        try {
          const storedValue = await StorageService.getItem(key);
          if (storedValue) {
            const summary = JSON.parse(storedValue);
            summaries.push(summary);
          }
        } catch (error) {
          console.error('❌ Error parsing summary for key:', key, error);
        }
      }
      
      console.log('✅ Loaded summaries:', summaries.length);
      return summaries;
    } catch (error) {
      console.error('❌ Error getting all summaries:', error);
      return [];
    }
  }
}
