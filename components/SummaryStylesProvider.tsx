import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { SummaryStyle } from '@/types/summary';
import { StorageService } from '@/services/storageService';

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
    writeClearRef.current = StorageService.setItemDebounced(
      STORAGE_KEY,
      JSON.stringify(newStyles),
      100,
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await StorageService.getItem(STORAGE_KEY);
        if (data) {
          setStylesState(JSON.parse(data));
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
