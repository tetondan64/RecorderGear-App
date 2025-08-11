import { getSavedSummary, saveSummary, deleteSavedSummary } from '@/utils/summaryStorage';
import { StorageService } from '@/services/storageService';
import { SavedSummary } from '@/types/summary';

jest.mock('@/services/storageService');

describe('summaryStorage helpers', () => {
  beforeEach(() => {
    (StorageService as any).__clear();
    jest.clearAllMocks();
  });

  it('saves and retrieves summaries', async () => {
    const summary: SavedSummary = {
      id: '1',
      fileId: 'file',
      styleId: 'style',
      content: 'content',
      createdAt: Date.now(),
    };
    await saveSummary(summary.id, summary);
    const loaded = await getSavedSummary(summary.id);
    expect(loaded).toEqual(summary);
  });

  it('returns null for missing or corrupted data', async () => {
    expect(await getSavedSummary('missing')).toBeNull();

    const key = 'recordingSummary:v1:bad';
    await StorageService.setItem(key, 'not-json');
    const loaded = await getSavedSummary('bad');
    expect(loaded).toBeNull();
    expect(StorageService.removeItem).toHaveBeenCalledWith(key);
  });

  it('deletes saved summaries', async () => {
    const summary: SavedSummary = {
      id: '2',
      fileId: 'file',
      styleId: 'style',
      content: 'content',
      createdAt: Date.now(),
    };
    await saveSummary(summary.id, summary);
    await deleteSavedSummary(summary.id);
    expect(await getSavedSummary(summary.id)).toBeNull();
    expect(StorageService.removeItem).toHaveBeenCalled();
  });
});
