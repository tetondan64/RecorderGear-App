import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { get, set, del, keys } from 'idb-keyval';
import logger from '../utils/logger';


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
      logger.error('StorageService.getItem error:', error);
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
      logger.error('StorageService.setItem error:', error);
      throw error;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await del(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      logger.error('StorageService.removeItem error:', error);
      throw error;
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        // Use idb-keyval's helper to retrieve all keys from IndexedDB
        const allKeys = await keys();
        return allKeys.map(key => String(key));
      } else {
        return (await AsyncStorage.getAllKeys()) as string[];
      }
    } catch (error) {
      logger.error('StorageService.getAllKeys error:', error);
      return [];
    }
  }
}