import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { StorageService } from '@/services/storageService';

interface SummaryStyle {
  id: string;
  name: string;
  prompt: string;
  updatedAt: number;
  builtIn: boolean;
}

type ChangeReason = 'seed' | 'create' | 'update' | 'remove';

interface ChangeEvent {
  type: 'summaryStyles/changed';
  reason: ChangeReason;
}

type Listener = (event: ChangeEvent) => void;

interface SummaryStylesContextType {
  styles: SummaryStyle[];
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  list: () => SummaryStyle[];
  create: (style: Omit<SummaryStyle, 'id' | 'updatedAt' | 'builtIn'>) => Promise<SummaryStyle>;
  update: (id: string, updates: Partial<Omit<SummaryStyle, 'id' | 'builtIn'>>) => Promise<SummaryStyle | null>;
  remove: (id: string) => Promise<void>;
  on: (event: ChangeEvent['type'], listener: Listener) => void;
  off: (event: ChangeEvent['type'], listener: Listener) => void;
}

const SummaryStylesContext = createContext<SummaryStylesContextType | null>(null);

const STORAGE_KEY = 'summaryStyles:v1';

const DEFAULT_STYLES: Array<Omit<SummaryStyle, 'updatedAt'>> = [
  { id: 'quick', name: 'Quick Summary', prompt: 'Provide a 1-2 sentence overview.', builtIn: true },
  { id: 'detailed', name: 'Detailed Summary', prompt: 'Provide a thorough paragraph summary.', builtIn: true },
  { id: 'bullets', name: 'Bullet Points', prompt: 'Summarize as concise bullet points.', builtIn: true },
  { id: 'action-items', name: 'Action Items', prompt: 'List action items and next steps.', builtIn: true },
  { id: 'key-takeaways', name: 'Key Takeaways', prompt: 'List key takeaways.', builtIn: true },
  { id: 'meeting-minutes', name: 'Meeting Minutes', prompt: 'Summarize as meeting minutes.', builtIn: true },
];

function generateId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
}

interface ProviderProps {
  children: ReactNode;
}

export function SummaryStylesProvider({ children }: ProviderProps) {
  const [styles, setStyles] = useState<SummaryStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const listenersRef = useRef<Set<Listener>>(new Set());
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emit = useCallback((reason: ChangeReason) => {
    const event: ChangeEvent = { type: 'summaryStyles/changed', reason };
    listenersRef.current.forEach(listener => listener(event));
  }, []);

  const persist = useCallback((next: SummaryStyle[]) => {
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current);
    }
    writeTimeoutRef.current = setTimeout(() => {
      StorageService.setItem(STORAGE_KEY, JSON.stringify(next)).catch(err => {
        console.error('Failed to persist summary styles:', err);
      });
    }, 300);
  }, []);

  const hydrate = useCallback(async () => {
    if (hydratedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const data = await StorageService.getItem(STORAGE_KEY);
      if (data) {
        const parsed: SummaryStyle[] = JSON.parse(data);
        setStyles(parsed);
      } else {
        const now = Date.now();
        const seeded = DEFAULT_STYLES.map(s => ({ ...s, updatedAt: now }));
        setStyles(seeded);
        persist(seeded);
        emit('seed');
      }
      hydratedRef.current = true;
    } catch (err: any) {
      console.error('Failed to hydrate summary styles:', err);
      setError(err?.message || 'Failed to hydrate');
    } finally {
      setLoading(false);
    }
  }, [emit, persist]);

  const list = useCallback(() => {
    return [...styles].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [styles]);

  const create = useCallback(async (style: Omit<SummaryStyle, 'id' | 'updatedAt' | 'builtIn'>) => {
    const newStyle: SummaryStyle = {
      ...style,
      id: generateId(),
      builtIn: false,
      updatedAt: Date.now(),
    };
    setStyles(prev => {
      const next = [...prev, newStyle];
      persist(next);
      return next;
    });
    emit('create');
    return newStyle;
  }, [persist, emit]);

  const update = useCallback(async (id: string, updates: Partial<Omit<SummaryStyle, 'id' | 'builtIn'>>) => {
    let updated: SummaryStyle | null = null;
    setStyles(prev => {
      const next = prev.map(style => {
        if (style.id === id) {
          updated = { ...style, ...updates, updatedAt: Date.now() };
          return updated;
        }
        return style;
      });
      persist(next);
      return next;
    });
    if (updated) emit('update');
    return updated;
  }, [persist, emit]);

  const remove = useCallback(async (id: string) => {
    setStyles(prev => {
      const next = prev.filter(s => s.id !== id);
      persist(next);
      return next;
    });
    emit('remove');
  }, [persist, emit]);

  const on = useCallback((event: ChangeEvent['type'], listener: Listener) => {
    if (event !== 'summaryStyles/changed') return;
    listenersRef.current.add(listener);
  }, []);

  const off = useCallback((event: ChangeEvent['type'], listener: Listener) => {
    if (event !== 'summaryStyles/changed') return;
    listenersRef.current.delete(listener);
  }, []);

  const value: SummaryStylesContextType = {
    styles,
    loading,
    error,
    hydrate,
    list,
    create,
    update,
    remove,
    on,
    off,
  };

  return (
    <SummaryStylesContext.Provider value={value}>
      {children}
    </SummaryStylesContext.Provider>
  );
}

export function useSummaryStyles(): SummaryStylesContextType {
  const ctx = useContext(SummaryStylesContext);
  if (!ctx) {
    throw new Error('useSummaryStyles must be used within a SummaryStylesProvider');
  }
  return ctx;
}

export type { SummaryStyle, ChangeEvent as SummaryStylesChangeEvent };

