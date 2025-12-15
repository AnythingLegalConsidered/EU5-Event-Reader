import path from 'path';
import fs from 'fs/promises';
import {
  EventOption,
  LocalizedEvent,
  LocalizationDictionary,
  LocalizationEntry,
  LocalizationResolveOptions,
  ParsedEvent,
  SupportedLanguage
} from '@shared';
import { readParadoxFile } from '../parsers/file-reader';
import { LocalizationParser } from '../parsers/localization-parser';
import { localizationConfig } from '../config/localization';

export class LocalizationService {
  private parser = new LocalizationParser();
  private dictionaries: LocalizationDictionary = {};
  private defaults = localizationConfig;

  constructor(config = localizationConfig) {
    this.defaults = config;
  }

  getLanguages(): SupportedLanguage[] {
    return Object.keys(this.dictionaries) as SupportedLanguage[];
  }

  getKeys(language: SupportedLanguage): string[] {
    const dict = this.dictionaries[language];
    return dict ? Array.from(dict.keys()) : [];
  }

  async loadLocalizationFile(filePath: string): Promise<number> {
    const content = await readParadoxFile(filePath);
    const entries = this.parser.parse(content, filePath);
    this.mergeEntries(entries);
    return entries.length;
  }

  async loadLocalizationDirectory(dirPath: string): Promise<number> {
    let count = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        count += await this.loadLocalizationDirectory(fullPath);
        continue;
      }
      if (entry.isFile() && /_l_[a-z]+\.yml$/i.test(entry.name)) {
        count += await this.loadLocalizationFile(fullPath);
      }
    }
    return count;
  }

  resolve(key: string, options: LocalizationResolveOptions): string {
    const language = options.language ?? this.defaults.defaultLanguage;
    const fallback = options.fallbackLanguage ?? this.defaults.fallbackLanguage;

    const resolved = this.resolveKeyInternal(key, language, options, new Set());
    if (resolved !== undefined) return resolved;

    const fallbackVal = this.resolveKeyInternal(key, fallback, options, new Set());
    if (fallbackVal !== undefined) return fallbackVal;

    return `[MISSING] ${key}`;
  }

  resolveEvent(event: ParsedEvent, options: LocalizationResolveOptions): LocalizedEvent {
    const localizedTitle = event.title ? this.resolve(event.title as string, options) : undefined;
    const localizedDesc = event.desc ? this.resolve(event.desc as string, options) : undefined;

    const localizedOptions = (event.options ?? []).map((opt: EventOption) => {
      const key = (opt.name ?? opt.title) as string | undefined;
      const localizedName = key ? this.resolve(key, options) : undefined;
      return { id: opt.id, localizedName, originalOption: opt };
    });

    return {
      ...event,
      localizedTitle,
      localizedDesc,
      localizedOptions
    };
  }

  private mergeEntries(entries: LocalizationEntry[]) {
    for (const entry of entries) {
      const lang = entry.language;
      if (!this.dictionaries[lang]) {
        this.dictionaries[lang] = new Map();
      }
      this.dictionaries[lang].set(entry.key, entry.value);
    }
  }

  private resolveKeyInternal(
    key: string,
    language: SupportedLanguage,
    options: LocalizationResolveOptions,
    seen: Set<string>
  ): string | undefined {
    if (seen.has(`${language}:${key}`)) {
      return `[CYCLE] ${key}`;
    }
    seen.add(`${language}:${key}`);

    const dict = this.dictionaries[language];
    if (!dict) return undefined;
    const raw = dict.get(key);
    if (raw === undefined) return undefined;

    if (!options.resolveVariables) return raw;

    return this.resolveVariables(raw, language, options, seen);
  }

  private resolveVariables(
    value: string,
    language: SupportedLanguage,
    options: LocalizationResolveOptions,
    seen: Set<string>
  ): string {
    return value.replace(/\$([^$]+)\$/g, (_match, varKey: string) => {
      const resolved = this.resolveKeyInternal(varKey, language, options, new Set(seen));
      if (resolved === undefined) {
        const fb = options.fallbackLanguage ?? this.defaults.fallbackLanguage;
        return this.resolveKeyInternal(varKey, fb, options, new Set(seen)) ?? `[MISSING] ${varKey}`;
      }
      return resolved;
    });
  }
}
