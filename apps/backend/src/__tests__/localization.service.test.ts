import path from 'path';
import { describe, expect, it } from 'vitest';
import { LocalizationService } from '../services/localization.service';
import { ParsedEvent } from '@shared';

const fixtures = path.join(__dirname, 'fixtures', 'localization');

const sampleEvent: ParsedEvent = {
  id: 100,
  title: 'event.100.title',
  desc: 'event.100.desc',
  options: [
    { id: 'a', name: 'event.100.option.a' }
  ]
};

describe('LocalizationService', () => {
  it('loads a single file and resolves keys', async () => {
    const service = new LocalizationService();
    await service.loadLocalizationFile(path.join(fixtures, 'events_l_english.yml'));
    const value = service.resolve('event.100.title', { language: 'english', resolveVariables: false });
    expect(value).toBe('Simple Title');
  });

  it('loads a directory recursively and supports fallback', async () => {
    const service = new LocalizationService();
    await service.loadLocalizationDirectory(fixtures);
    const titleFr = service.resolve('event.100.title', { language: 'french', fallbackLanguage: 'english', resolveVariables: false });
    expect(titleFr).toBe('Titre Simple');
    const titleMissing = service.resolve('unknown.key', { language: 'french', fallbackLanguage: 'english', resolveVariables: false });
    expect(titleMissing.startsWith('[MISSING]')).toBe(true);
  });

  it('resolves variables recursively', async () => {
    const service = new LocalizationService();
    await service.loadLocalizationFile(path.join(fixtures, 'variables_l_english.yml'));
    const greeting = service.resolve('chained', { language: 'english', resolveVariables: true });
    expect(greeting).toBe('Hello World, traveler');
  });

  it('resolves an event with localized fields and caches dictionaries', async () => {
    const service = new LocalizationService();
    await service.loadLocalizationDirectory(fixtures);
    const localized = service.resolveEvent(sampleEvent, { language: 'french', fallbackLanguage: 'english', resolveVariables: true });
    expect(localized.localizedTitle).toBe('Titre Simple');
    expect(localized.localizedOptions?.[0]?.localizedName).toBe('Faire l\'action');
    const second = service.resolveEvent(sampleEvent, { language: 'french', fallbackLanguage: 'english', resolveVariables: true });
    expect(second.localizedTitle).toBe(localized.localizedTitle);
  });
});
