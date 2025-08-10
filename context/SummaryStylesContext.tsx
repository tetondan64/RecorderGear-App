import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SummaryStyle } from '@/types/summary';
import { DEFAULT_SUMMARY_STYLES } from '@/data/summaryStylesDefaults';
import {
  summaryStylesEmitter,
  list as listStyles,
  hydrate as hydrateStyles,
  create as createStyle,
  update as updateStyle,
  remove as removeStyle,
} from '@/data/summaryStylesStore';

interface SummaryStylesState {
  styles: SummaryStyle[];
  loading: boolean;
  error?: string;
}

interface SummaryStylesContextValue {
  state: SummaryStylesState;
  list: () => Promise<SummaryStyle[]>;
  hydrate: () => Promise<void>;
  create: (style: Omit<SummaryStyle, 'id' | 'updatedAt'>) => Promise<SummaryStyle>;
  update: (id: string, updates: Partial<Omit<SummaryStyle, 'id' | 'updatedAt'>>) => Promise<SummaryStyle | null>;
  remove: (id: string) => Promise<void>;
  emitter: typeof summaryStylesEmitter;
}

const SummaryStylesContext = createContext<SummaryStylesContextValue | undefined>(undefined);

export function SummaryStylesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SummaryStylesState>({ styles: [], loading: true });

  const hydrate = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: undefined }));
      const styles = await hydrateStyles(DEFAULT_SUMMARY_STYLES);
      setState({ styles, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load summary styles';
      setState({ styles: [], loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleChange = async () => {
      const styles = await listStyles();
      setState(prev => ({ ...prev, styles }));
    };
    summaryStylesEmitter.on('summaryStyles/changed', handleChange);
    return () => {
      summaryStylesEmitter.off('summaryStyles/changed', handleChange);
    };
  }, []);

  const list = useCallback(async () => {
    const styles = await listStyles();
    setState(prev => ({ ...prev, styles }));
    return styles;
  }, []);

  const create = useCallback(async (style: Omit<SummaryStyle, 'id' | 'updatedAt'>) => {
    const newStyle = await createStyle(style);
    return newStyle;
  }, []);

  const update = useCallback(async (id: string, updates: Partial<Omit<SummaryStyle, 'id' | 'updatedAt'>>) => {
    const updated = await updateStyle(id, updates);
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await removeStyle(id);
  }, []);

  const value: SummaryStylesContextValue = {
    state,
    list,
    hydrate,
    create,
    update,
    remove,
    emitter: summaryStylesEmitter,
  };

  return (
    <SummaryStylesContext.Provider value={value}>
      {children}
    </SummaryStylesContext.Provider>
  );
}

export function useSummaryStyles() {
  const ctx = useContext(SummaryStylesContext);
  if (!ctx) {
    throw new Error('useSummaryStyles must be used within a SummaryStylesProvider');
  }
  return ctx;
}
