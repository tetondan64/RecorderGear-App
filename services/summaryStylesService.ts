
import { SummaryStyle } from '@/types/summary';
import { StorageService } from './storageService';
import { getDefaultSummaryStyles } from '@/data/defaultSummaryStyles';

export class SummaryStylesService {
  private static readonly STORAGE_KEY = 'summaryStyles';

  // Debug utility to check storage state
  static async debugStorage(): Promise<void> {
    try {
      console.log('🔍 Debug summary styles storage check');
      
      const value = await StorageService.getItem(this.STORAGE_KEY);
      console.log('🔍 Debug retrieved value exists:', value !== null);
      console.log('🔍 Debug retrieved value preview:', 
        value ? value.substring(0, 200) + '...' : 'null'
      );
      
      // Show all keys for comparison
      const allKeys = await StorageService.getAllKeys();
      console.log('🔍 All storage keys:', allKeys);
      
      // Filter to summary-related keys
      const summaryKeys = allKeys.filter(k => k.includes('summary'));
      console.log('🔍 Summary keys only:', summaryKeys);
      
    } catch (error) {
      console.error('❌ Debug storage failed:', error);
    }
  }

  static async storeSummaryStylesWithVerification(data: SummaryStyle[]): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 200;
    
    // 📦 Log what we're storing before save
    console.log('📦 Storing summary styles:');
    console.log('📦 Data type:', typeof data);
    console.log('📦 Data is array:', Array.isArray(data));
    console.log('📦 Styles count:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (Array.isArray(data)) {
      console.log('📦 Summary styles validation before store:');
      console.log('  - Total styles:', data.length);
      data.forEach((style, index) => {
        console.log(`  - Style ${index}: ${style?.title || 'No title'} (${style?.id || 'No ID'})`);
      });
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Storage attempt ${attempt}/${maxRetries} for summary styles`);
        console.log('📌 Exact storage key:', this.STORAGE_KEY);
        console.log('💾 Data being stored:', {
          type: typeof data,
          isArray: Array.isArray(data),
          stylesCount: Array.isArray(data) ? data.length : 'Not an array'
        });
        
        // Store the summary styles
        await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(data));
        console.log(`✅ AsyncStorage.setItem completed for attempt ${attempt}`);
        
        // Small delay to ensure storage is committed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify storage immediately
        console.log(`🔍 Verifying storage for attempt ${attempt}...`);
        
        const storedValue = await StorageService.getItem(this.STORAGE_KEY);
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

  static async initializeDefaultStyles(): Promise<void> {
    try {
      console.log('🔍 Initializing default summary styles...');
      
      const existingStyles = await this.getAllSummaryStyles();
      console.log('🔍 Existing styles count:', existingStyles.length);
      
      if (existingStyles.length === 0) {
        console.log('📦 No existing styles found, creating defaults...');
        const defaultStyles = getDefaultSummaryStyles();
        console.log('📦 Default styles to create:', defaultStyles.length);
        
        const stored = await this.storeSummaryStylesWithVerification(defaultStyles);
        if (stored) {
          console.log('✅ Default summary styles initialized successfully');
        } else {
          throw new Error('Failed to store default summary styles');
        }
      } else {
        console.log('✅ Summary styles already exist, skipping initialization');
      }
    } catch (error) {
      console.error('❌ Failed to initialize default summary styles:', error);
      throw error;
    }
  }

  static async getAllSummaryStyles(): Promise<SummaryStyle[]> {
    try {
      console.log('🔍 getAllSummaryStyles called');
      
      const data = await StorageService.getItem(this.STORAGE_KEY);
      console.log('🔍 Retrieved data exists:', data !== null);
      
      if (!data) {
        console.log('📦 No summary styles found, returning empty array');
        return [];
      }
      
      const styles = JSON.parse(data);
      console.log('✅ Summary styles loaded:', {
        exists: !!styles,
        isArray: Array.isArray(styles),
        count: Array.isArray(styles) ? styles.length : 'Not an array'
      });
      
      return Array.isArray(styles) ? styles : [];
    } catch (error) {
      console.error('❌ Error loading summary styles:', error);
      return [];
    }
  }

  static async getSummaryStyleById(styleId: string): Promise<SummaryStyle | null> {
    try {
      console.log('🔍 getSummaryStyleById called with ID:', styleId);
      
      const styles = await this.getAllSummaryStyles();
      const style = styles.find(s => s.id === styleId);
      
      console.log('🔍 Found style:', !!style);
      
      return style || null;
    } catch (error) {
      console.error('❌ Error getting summary style by ID:', error);
      return null;
    }
  }

  static async saveSummaryStyle(style: SummaryStyle): Promise<void> {
    try {
      console.log('🔍 saveSummaryStyle called:', {
        styleId: style?.id,
        title: style?.title
      });
      
      const styles = await this.getAllSummaryStyles();
      const existingIndex = styles.findIndex(s => s.id === style.id);
      
      if (existingIndex >= 0) {
        console.log('📝 Updating existing style at index:', existingIndex);
        styles[existingIndex] = { ...style, updatedAt: new Date().toISOString() };
      } else {
        console.log('📝 Adding new style');
        styles.push(style);
      }
      
      const stored = await this.storeSummaryStylesWithVerification(styles);
      if (!stored) {
        throw new Error('Failed to store summary style after multiple attempts');
      }
      
      console.log('✅ Summary style saved successfully');
    } catch (error) {
      console.error('❌ Error saving summary style:', error);
      throw error;
    }
  }

  static async createSummaryStyle(
    title: string,
    subtitle: string,
    instructions: string
  ): Promise<SummaryStyle> {
    try {
      console.log('🔍 createSummaryStyle called:', { title, subtitle });
      
      const newStyle: SummaryStyle = {
        id: `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        subtitle,
        instructions,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await this.saveSummaryStyle(newStyle);
      
      console.log('✅ Summary style created successfully:', newStyle.id);
      return newStyle;
    } catch (error) {
      console.error('❌ Error creating summary style:', error);
      throw error;
    }
  }

  static async updateSummaryStyle(
    styleId: string,
    updates: Partial<Omit<SummaryStyle, 'id' | 'createdAt'>>
  ): Promise<SummaryStyle | null> {
    try {
      console.log('🔍 updateSummaryStyle called:', { styleId, updates });
      
      const existingStyle = await this.getSummaryStyleById(styleId);
      if (!existingStyle) {
        console.log('❌ Style not found for update:', styleId);
        return null;
      }
      
      const updatedStyle: SummaryStyle = {
        ...existingStyle,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await this.saveSummaryStyle(updatedStyle);
      
      console.log('✅ Summary style updated successfully');
      return updatedStyle;
    } catch (error) {
      console.error('❌ Error updating summary style:', error);
      throw error;
    }
  }

  static async deleteSummaryStyle(styleId: string): Promise<void> {
    try {
      console.log('🔍 deleteSummaryStyle called:', styleId);
      
      const styles = await this.getAllSummaryStyles();
      const styleToDelete = styles.find(s => s.id === styleId);
      
      if (!styleToDelete) {
        console.log('❌ Style not found for deletion:', styleId);
        return;
      }
      
      if (styleToDelete.isDefault) {
        console.log('❌ Cannot delete default style:', styleId);
        throw new Error('Cannot delete default summary styles');
      }
      
      const filtered = styles.filter(s => s.id !== styleId);
      
      const stored = await this.storeSummaryStylesWithVerification(filtered);
      if (!stored) {
        throw new Error('Failed to delete summary style after multiple attempts');
      }
      
      console.log('✅ Summary style deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting summary style:', error);
      throw error;
    }
  }

  static async getDefaultSummaryStyles(): Promise<SummaryStyle[]> {
    try {
      console.log('🔍 getDefaultSummaryStyles called');
      
      const styles = await this.getAllSummaryStyles();
      const defaultStyles = styles.filter(s => s.isDefault);
      
      console.log('🔍 Default styles found:', defaultStyles.length);
      
      return defaultStyles;
    } catch (error) {
      console.error('❌ Error getting default summary styles:', error);
      return [];
    }
  }

  static async hasAnyStyles(): Promise<boolean> {
    try {
      console.log('🔍 hasAnyStyles called');
      
      const styles = await this.getAllSummaryStyles();
      const hasStyles = styles.length > 0;
      
      console.log('🔍 Has styles result:', hasStyles);
      
      return hasStyles;
    } catch (error) {
      console.error('❌ hasAnyStyles failed:', error);
      return false;
    }
  }
}
