import { SupportedLanguage } from '@shared';

const SOURCE_KEY = 'eu5_source';
const LANGUAGE_KEY = 'eu5_language';

const isSupportedSource = (value: unknown): value is 'vanilla' | 'local' =>
  value === 'vanilla' || value === 'local';

const supportedLanguages: SupportedLanguage[] = ['english', 'french', 'german', 'spanish', 'russian'];

const isSupportedLanguage = (value: unknown): value is SupportedLanguage =>
  typeof value === 'string' && supportedLanguages.includes(value as SupportedLanguage);

export const getStoredSource = (): 'vanilla' | 'local' => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return 'vanilla';
  }
  const value = window.localStorage.getItem(SOURCE_KEY);
  return isSupportedSource(value) ? value : 'vanilla';
};

export const setStoredSource = (source: 'vanilla' | 'local') => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  window.localStorage.setItem(SOURCE_KEY, source);
};

export const getStoredLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return 'english';
  }
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return isSupportedLanguage(value) ? value : 'english';
};

export const setStoredLanguage = (language: SupportedLanguage) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  window.localStorage.setItem(LANGUAGE_KEY, language);
};
