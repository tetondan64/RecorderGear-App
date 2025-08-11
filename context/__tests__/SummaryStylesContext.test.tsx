import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { SummaryStylesProvider, useSummaryStyles } from '@/context/SummaryStylesContext';
import { StorageService } from '@/services/storageService';

jest.mock('@/services/storageService');

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SummaryStylesProvider>{children}</SummaryStylesProvider>
);

beforeEach(() => {
  (StorageService as any).__clear();
  jest.clearAllMocks();
});

describe('SummaryStylesContext', () => {
  it('seeds default styles when hydrating with empty storage', async () => {
    const { result } = renderHook(() => useSummaryStyles(), { wrapper });
    await act(async () => {
      await result.current.hydrate();
    });
    expect(result.current.styles.length).toBe(6);
    expect(result.current.styles.every(s => s.builtIn)).toBe(true);
  });

  it('can create, update, and remove styles', async () => {
    const { result } = renderHook(() => useSummaryStyles(), { wrapper });
    await act(async () => {
      await result.current.hydrate();
    });

    let created: any;
    await act(async () => {
      created = await result.current.create({ name: 'Custom', prompt: 'Test prompt' });
    });
    expect(created.builtIn).toBe(false);
    expect(result.current.styles.find(s => s.id === created.id)).toBeTruthy();

    await act(async () => {
      await result.current.update(created.id, { name: 'Updated' });
    });
    expect(result.current.styles.find(s => s.id === created.id)?.name).toBe('Updated');

    await act(async () => {
      await result.current.remove(created.id);
    });
    expect(result.current.styles.find(s => s.id === created.id)).toBeUndefined();
  });

  it('orders styles by most recent updatedAt', async () => {
    let now = 0;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => ++now);

    const { result } = renderHook(() => useSummaryStyles(), { wrapper });
    await act(async () => {
      await result.current.hydrate();
    });

    let first: any;
    await act(async () => {
      first = await result.current.create({ name: 'First', prompt: 'one' });
    });
    let second: any;
    await act(async () => {
      second = await result.current.create({ name: 'Second', prompt: 'two' });
    });

    let list = result.current.list();
    expect(list[0].id).toBe(second.id);
    expect(list[1].id).toBe(first.id);

    await act(async () => {
      await result.current.update(first.id, { name: 'First Updated' });
    });
    list = result.current.list();
    expect(list[0].id).toBe(first.id);

    nowSpy.mockRestore();
  });
});
