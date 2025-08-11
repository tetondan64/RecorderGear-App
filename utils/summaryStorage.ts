import { StorageService } from '@/services/storageService';
import { SavedSummary } from '@/types/summary';
import { safeParse, safeStringify } from '@/utils/json';

const SUMMARY_PREFIX = 'recordingSummary:v1:';

function getKey(id: string): string {
  return `${SUMMARY_PREFIX}${id}`;
}

export async function getSavedSummary(id: string): Promise<SavedSummary | null> {
  const key = getKey(id);
  try {
    const json = await StorageService.getItem(key);
    if (!json) return null;
    const parsed = safeParse<SavedSummary | null>(json, null);
    if (parsed) return parsed;
    await StorageService.removeItem(key);
    return null;
  } catch (error) {
    console.error('Failed to get saved summary:', error);
    await StorageService.removeItem(key);
    return null;
  }
}

export async function saveSummary(id: string, summary: SavedSummary): Promise<void> {
  const key = getKey(id);
  try {
    // Validate existing data is valid JSON, otherwise reset
    const existing = await StorageService.getItem(key);
    if (existing) {
      const valid = safeParse<any | null>(existing, null);
      if (!valid) {
        await StorageService.removeItem(key);
      }
    }

    const json = safeStringify(summary);
    if (!json) {
      throw new Error('Failed to serialize summary');
    }
    await StorageService.setItem(key, json);
  } catch (error) {
    console.error('Failed to save summary:', error);
    await StorageService.removeItem(key);
    throw error;
  }
}

export async function deleteSavedSummary(id: string): Promise<void> {
  const key = getKey(id);
  try {
    await StorageService.removeItem(key);
  } catch (error) {
    console.error('Failed to delete saved summary:', error);
    throw error;
  }
}

