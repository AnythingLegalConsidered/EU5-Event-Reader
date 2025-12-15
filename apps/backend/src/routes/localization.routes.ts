import { Router } from 'express';
import { LocalizationService } from '../services/localization.service';
import { LocalizationResolveOptions, ParsedEvent, SupportedLanguage } from '@shared';
import { localizationConfig } from '../config/localization';

type LocalizationDefaults = {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isParsedEventLike = (value: any): value is ParsedEvent =>
  value && (typeof value.id === 'string' || typeof value.id === 'number') && typeof value.title === 'string' && typeof value.desc === 'string';

export const createLocalizationRouter = (
  service: LocalizationService,
  defaults: LocalizationDefaults = localizationConfig
): Router => {
  const router = Router();

  router.get('/languages', (_req, res) => {
    res.json({ languages: service.getLanguages() });
  });

  router.get('/keys', (req, res) => {
    const language = (req.query.language as SupportedLanguage) ?? defaults.defaultLanguage;
    const keys = service.getKeys(language);
    res.json({ language, keys, count: keys.length });
  });

  router.post('/resolve', (req, res) => {
    const { keys, language = defaults.defaultLanguage, fallbackLanguage = defaults.fallbackLanguage, resolveVariables = true } = req.body as {
      keys?: unknown;
      language?: SupportedLanguage;
      fallbackLanguage?: SupportedLanguage;
      resolveVariables?: boolean;
    };

    if (!isStringArray(keys)) {
      return res.status(400).json({ error: "'keys' must be an array of strings" });
    }

    const translations: Record<string, string> = {};
    const missing: string[] = [];
    const options: LocalizationResolveOptions = { language, fallbackLanguage, resolveVariables };

    for (const key of keys) {
      const value = service.resolve(key, options);
      translations[key] = value;
      if (value.startsWith('[MISSING]')) missing.push(key);
    }

    res.json({ translations, missing });
  });

  router.post('/resolve-event', (req, res) => {
    const { event, language = defaults.defaultLanguage, fallbackLanguage = defaults.fallbackLanguage, resolveVariables = true } = req.body as {
      event?: unknown;
      language?: SupportedLanguage;
      fallbackLanguage?: SupportedLanguage;
      resolveVariables?: boolean;
    };

    if (!isParsedEventLike(event)) {
      return res
        .status(400)
        .json({ error: "'event' must include id (string|number), title (string), desc (string)" });
    }

    const options: LocalizationResolveOptions = { language, fallbackLanguage, resolveVariables };
    const localizedEvent = service.resolveEvent(event, options);
    res.json({ localizedEvent });
  });

  router.post('/load', async (req, res) => {
    const { path: targetPath, type } = req.body as { path?: unknown; type?: unknown };

    if (typeof targetPath !== 'string' || targetPath.trim().length === 0 || (type !== 'file' && type !== 'directory')) {
      return res.status(400).json({ error: "'path' must be a non-empty string and 'type' must be 'file' or 'directory'" });
    }

    try {
      let loaded = 0;
      if (type === 'file') {
        loaded = await service.loadLocalizationFile(targetPath);
      } else {
        loaded = await service.loadLocalizationDirectory(targetPath);
      }
      res.json({ status: 'ok', loaded, languages: service.getLanguages() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to load localization' });
    }
  });

  return router;
};
