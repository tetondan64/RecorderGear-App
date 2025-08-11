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
    // eslint-disable-next-line no-undef
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setStyles = (newStyles: SummaryStyle[]) => {
    setStylesState(newStyles);
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current);
    }
    writeTimeoutRef.current = setTimeout(() => {
      StorageService.setItem(STORAGE_KEY, JSON.stringify(newStyles)).catch(err => {
        console.error('Failed to save summary styles:', err);
      });
    }, 100);
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
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }
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
