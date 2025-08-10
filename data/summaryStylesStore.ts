import { EventEmitter } from 'events';
import { createRequire } from 'module';
import type { SummaryStyle } from '../types/summary.ts';

export const SUMMARY_STYLES_KEY = 'summaryStyles:v1';

export interface StorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const require = createRequire(import.meta.url);

let storage: StorageLike;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage as StorageLike;
} catch {
  const memory: Record<string, string> = {};
  storage = {
    async getItem(key: string) {
      return memory[key] ?? null;
    },
    async setItem(key: string, value: string) {
      memory[key] = value;
    },
    async removeItem(key: string) {
      delete memory[key];
    },
  };
}

export const summaryStylesEmitter = new EventEmitter();

export function setStorage(custom: StorageLike) {
  storage = custom;
}

export async function list(): Promise<SummaryStyle[]> {
  const raw = await storage.getItem(SUMMARY_STYLES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function persist(styles: SummaryStyle[]): Promise<void> {
  await storage.setItem(SUMMARY_STYLES_KEY, JSON.stringify(styles));
}

export async function hydrate(defaults: SummaryStyle[] = []): Promise<SummaryStyle[]> {
  const current = await list();
  if (current.length === 0 && defaults.length > 0) {
    await persist(defaults);
    summaryStylesEmitter.emit('summaryStyles/changed');
    return defaults;
  }
  return current;
}

export async function create(style: Omit<SummaryStyle, 'id' | 'updatedAt'>): Promise<SummaryStyle> {
  const styles = await list();
  const newStyle: SummaryStyle = {
    ...style,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
  };
  const updated = [...styles, newStyle];
  await persist(updated);
  summaryStylesEmitter.emit('summaryStyles/changed');
  return newStyle;
}

export async function update(id: string, updates: Partial<Omit<SummaryStyle, 'id' | 'updatedAt'>>): Promise<SummaryStyle | null> {
  const styles = await list();
  let updatedStyle: SummaryStyle | null = null;
  const updated = styles.map(s => {
    if (s.id === id) {
      updatedStyle = { ...s, ...updates, updatedAt: Date.now() };
      return updatedStyle;
    }
    return s;
  });
  if (!updatedStyle) return null;
  await persist(updated);
  summaryStylesEmitter.emit('summaryStyles/changed');
  return updatedStyle;
}

export async function remove(id: string): Promise<void> {
  const styles = await list();
  const updated = styles.filter(s => s.id !== id);
  await persist(updated);
  summaryStylesEmitter.emit('summaryStyles/changed');
}
