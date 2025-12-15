import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { SupportedLanguage } from '@shared';
import { getStoredLanguage, getStoredSource, setStoredLanguage, setStoredSource } from '../utils/storage';
import { clearPaginatedEventsCache } from '../hooks/usePaginatedEvents';

export type AppContextState = {
  source: 'vanilla' | 'local';
  language: SupportedLanguage;
  setSource: (source: 'vanilla' | 'local') => void;
  setLanguage: (language: SupportedLanguage) => void;
};

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [source, setSourceState] = useState<'vanilla' | 'local'>(() => getStoredSource());
  const [language, setLanguageState] = useState<SupportedLanguage>(() => getStoredLanguage());

  useEffect(() => {
    setStoredSource(source);
    clearPaginatedEventsCache();
  }, [source]);

  useEffect(() => {
    setStoredLanguage(language);
    clearPaginatedEventsCache();
  }, [language]);

  const value = useMemo<AppContextState>(
    () => ({
      source,
      language,
      setSource: setSourceState,
      setLanguage: setLanguageState
    }),
    [source, language]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextState => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};
