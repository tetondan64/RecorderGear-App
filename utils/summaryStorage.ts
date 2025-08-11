import { StorageService } from '@/services/storageService';
import { SavedSummary } from '@/types/summary';

const SUMMARY_PREFIX = 'recordingSummary:v1:';

function getKey(id: string): string {
  return `${SUMMARY_PREFIX}${id}`;
}

export async function getSavedSummary(id: string): Promise<SavedSummary | null> {
  const key = getKey(id);
  try {
    const json = await StorageService.getItem(key);
    if (!json) return null;
    return JSON.parse(json) as SavedSummary;
  } catch (error) {
    console.error('Failed to get saved summary:', error);
    // Reset corrupted data
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
      try {
        JSON.parse(existing);
      } catch {
        await StorageService.removeItem(key);
      }
    }

    await StorageService.setItem(key, JSON.stringify(summary));
  } catch (error) {
    console.error('Failed to save summary:', error);
    // If something went wrong during save, remove potentially corrupted data
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

