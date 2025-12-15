import path from 'path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameDataService } from '../services/game-data.service';

const fixturesDir = path.join(__dirname, 'fixtures');

let service: GameDataService;

const createService = async () => {
  const { EventParserService } = await import('../services/event-parser.service');
  const { GameDataService } = await import('../services/game-data.service');
  const { LocalizationService } = await import('../services/localization.service');
  const { localizationConfig } = await import('../config/localization');

  const localizationService = new LocalizationService(localizationConfig);
  await localizationService.loadLocalizationDirectory(path.join(fixturesDir, 'localization'));

  return new GameDataService(new EventParserService(), localizationService);
};

beforeAll(() => {
  process.env.VANILLA_EVENTS_PATH = fixturesDir;
  process.env.LOCAL_EVENTS_PATH = fixturesDir;
  process.env.DEFAULT_SOURCE = 'vanilla';
});

beforeEach(async () => {
  vi.resetModules();
  service = await createService();
});

describe('GameDataService', () => {
  it('discovers countries with counts', async () => {
    const countries = await service.discoverCountries('vanilla');
    expect(countries.map((c: any) => c.tag)).toEqual(['ENG', 'FRA']);
    const fra = countries.find((c: any) => c.tag === 'FRA');
    expect(fra?.eventCount).toBe(2);
    expect(fra?.name).toBe('France');
  });

  it('returns cached events per country', async () => {
    const first = await service.getEventsByCountry('FRA');
    const second = await service.getEventsByCountry('FRA');
    expect(first).toBe(second);
  });

  it('localizes events by country', async () => {
    const events = await service.getLocalizedEventsByCountry('FRA', {
      source: 'vanilla',
      language: 'french',
      fallbackLanguage: 'english'
    });
    expect(events[0].localizedTitle).toContain('Événement Français');
  });

  it('finds an event by id', async () => {
    const event = await service.getEventById('flavor_fra.1', 'vanilla');
    expect(event?.id).toBe(1);
  });
});
