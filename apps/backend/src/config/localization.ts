import { SupportedLanguage } from '@shared';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['english', 'french', 'german', 'spanish', 'russian'];

const normalizeLanguage = (value: string | undefined): SupportedLanguage | undefined => {
  const lower = value?.toLowerCase();
  return SUPPORTED_LANGUAGES.find(lang => lang === lower) as SupportedLanguage | undefined;
};

const defaultLang = normalizeLanguage(process.env.DEFAULT_LANGUAGE) ?? 'english';
const fallbackLang = normalizeLanguage(process.env.FALLBACK_LANGUAGE) ?? 'english';

if (process.env.DEFAULT_LANGUAGE && defaultLang === 'english' && process.env.DEFAULT_LANGUAGE.toLowerCase() !== 'english') {
  console.warn(`DEFAULT_LANGUAGE '${process.env.DEFAULT_LANGUAGE}' is not supported. Falling back to 'english'.`);
}
if (process.env.FALLBACK_LANGUAGE && fallbackLang === 'english' && process.env.FALLBACK_LANGUAGE.toLowerCase() !== 'english') {
  console.warn(`FALLBACK_LANGUAGE '${process.env.FALLBACK_LANGUAGE}' is not supported. Falling back to 'english'.`);
}

export const localizationConfig = {
  defaultLanguage: defaultLang,
  fallbackLanguage: fallbackLang
};

export const getLanguages = () => SUPPORTED_LANGUAGES;
export const toSupportedLanguage = normalizeLanguage;
