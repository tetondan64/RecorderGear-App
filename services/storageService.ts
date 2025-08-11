import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, set, del } from 'idb-keyval';

export class StorageService {
  /**
   * Cross-platform storage abstraction
   * - Web: Uses IndexedDB via idb-keyval for large data support
   * - Mobile: Uses AsyncStorage as before
   */
  
  static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        const value = await get(key);
        return value || null;
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('StorageService.getItem error:', error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await set(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('StorageService.setItem error:', error);
      throw error;
    }
  }

  static setItemDebounced(key: string, value: string, delay: number): () => void {
    const timeout = setTimeout(() => {
      StorageService.setItem(key, value).catch(error => {
        console.error('StorageService.setItemDebounced error:', error);
      });
    }, delay);

    return () => clearTimeout(timeout);
  }

  static async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await del(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('StorageService.removeItem error:', error);
      throw error;
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        // IndexedDB doesn't have a direct getAllKeys equivalent
        // We'll need to track keys manually or use a different approach
        // For now, return empty array as this is mainly used for debugging
        return [];
      } else {
        return await AsyncStorage.getAllKeys();
      }
    } catch (error) {
      console.error('StorageService.getAllKeys error:', error);
      return [];
    }
  }
}