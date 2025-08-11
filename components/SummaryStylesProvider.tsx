import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { SummaryStyle } from '@/types/summary';
import { StorageService } from '@/services/storageService';
import { safeParse, safeStringify } from '@/utils/json';

const STORAGE_KEY = 'summary.styles.v1';

interface SummaryStylesContextValue {
  styles: SummaryStyle[];
  setStyles: (styles: SummaryStyle[]) => void;
}

const SummaryStylesContext = createContext<SummaryStylesContextValue | undefined>(undefined);

export function SummaryStylesProvider({ children }: { children: ReactNode }) {
  const [styles, setStylesState] = useState<SummaryStyle[]>([]);
  const writeClearRef = useRef<(() => void) | null>(null);

  const setStyles = (newStyles: SummaryStyle[]) => {
    setStylesState(newStyles);
    if (writeClearRef.current) {
      writeClearRef.current();
    }

  };

  useEffect(() => {
    (async () => {
      try {
        const data = await StorageService.getItem(STORAGE_KEY);
        if (data) {
          const parsed = safeParse<SummaryStyle[] | null>(data, null);
          if (parsed) {
            setStylesState(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to load summary styles:', err);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      writeClearRef.current?.();
    };
  }, []);

  return (
    <SummaryStylesContext.Provider value={{ styles, setStyles }}>
      {children}
    </SummaryStylesContext.Provider>
  );
}

export function useSummaryStyles() {
  const context = useContext(SummaryStylesContext);
  if (!context) {
    throw new Error('useSummaryStyles must be used within a SummaryStylesProvider');
  }
  return context;
}
