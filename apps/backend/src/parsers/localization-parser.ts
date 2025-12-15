import { LocalizationEntry, SupportedLanguage } from '@shared';

const HEADER_REGEX = /^l_([a-z]+):\s*$/i;
const ENTRY_REGEX = /^([^:#\s][^:]*?)\s*:\s*"(.*)"\s*$/;

const isSupportedLanguage = (lang: string): lang is SupportedLanguage =>
  ['english', 'french', 'german', 'spanish', 'russian'].includes(lang);

export class LocalizationParser {
  parse(content: string, fileName: string): LocalizationEntry[] {
    const lines = content.split('\n');
    let language: SupportedLanguage | undefined;
    const entries: LocalizationEntry[] = [];

    lines.forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const line = rawLine.replace(/^\uFEFF/, '').trim();
      if (!line || line.startsWith('#')) return;

      if (!language) {
        const headerMatch = line.match(HEADER_REGEX);
        if (!headerMatch) {
          throw new Error(`Invalid localization header in ${fileName} at line ${lineNumber}`);
        }
        const parsedLang = headerMatch[1].toLowerCase();
        if (!isSupportedLanguage(parsedLang)) {
          throw new Error(`Unsupported localization language '${parsedLang}' in ${fileName} at line ${lineNumber}`);
        }
        language = parsedLang;
        return;
      }

      const match = line.match(ENTRY_REGEX);
      if (!match) {
        throw new Error(`Invalid localization entry at line ${lineNumber} in ${fileName}: '${line}'`);
      }

      const key = match[1].trim();
      const rawValue = match[2];
      const value = rawValue.replace(/\\"/g, '"');
      entries.push({ key, value, language });
    });

    if (!language) {
      throw new Error(`Missing localization header in ${fileName}`);
    }

    return entries;
  }
}
