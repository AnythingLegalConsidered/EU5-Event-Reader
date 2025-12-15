import { EventOption, ParsedEvent } from './event';

// Type pour une entrée de localisation brute (clé → valeur)
export type LocalizationEntry = {
  key: string;
  value: string;
  language: SupportedLanguage;
};

// Type pour un dictionnaire de localisation par langue
export type LocalizationDictionary = {
  [language: string]: Map<string, string>;
};

// Type pour les langues supportées
export type SupportedLanguage = 'english' | 'french' | 'german' | 'spanish' | 'russian';

// Options de résolution
export type LocalizationResolveOptions = {
  language: SupportedLanguage;
  fallbackLanguage?: SupportedLanguage;
  resolveVariables?: boolean; // gestion des substitutions $key$
};

// Événement avec traductions résolues
export type LocalizedEvent = ParsedEvent & {
  localizedTitle?: string;
  localizedDesc?: string;
  localizedOptions?: Array<{
    id?: string | number;
    localizedName?: string;
    originalOption: EventOption;
  }>;
};
