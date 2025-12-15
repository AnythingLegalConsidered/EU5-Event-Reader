import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { performance } from 'perf_hooks';
import { EventParserService } from '../services/event-parser.service';
import { DependencyAnalyzerService } from '../services/dependency-analyzer.service';
import { GameDataService } from '../services/game-data.service';
import { LocalizationService } from '../services/localization.service';
import { localizationConfig } from '../config/localization';

const fixturesDir = path.join(__dirname, 'fixtures');

const setupServices = () => {
  process.env.VANILLA_EVENTS_PATH = fixturesDir;
  process.env.LOCAL_EVENTS_PATH = fixturesDir;
  process.env.DEFAULT_SOURCE = 'vanilla';
  const parser = new EventParserService();
  const localization = new LocalizationService(localizationConfig);
  const gameData = new GameDataService(parser, localization);
  const deps = new DependencyAnalyzerService(gameData);
  return { parser, gameData, deps, localization };
};

const toCleanup: Array<() => Promise<void>> = [];

afterAll(async () => {
  await Promise.all(toCleanup.map(fn => fn()));
});

describe('Performance smoke tests', () => {
  it('parses events under threshold', async () => {
    const { parser } = setupServices();
    toCleanup.push(() => parser.shutdown());
    const file = path.join(fixturesDir, 'flavor_fra.txt');
    const t0 = performance.now();
    const events = await parser.parseEventFileAsync(file);
    const duration = performance.now() - t0;
    expect(events.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1500);
  });

  it('dependency analysis stays reasonable', async () => {
    const { gameData, deps, localization } = setupServices();
    toCleanup.push(() => gameData.parser.shutdown());
    await localization.loadLocalizationDirectory(path.join(fixturesDir, 'localization'));
    const t0 = performance.now();
    const graphs = await deps.getDependenciesByCountry('FRA');
    const duration = performance.now() - t0;
    expect(graphs.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1500);
    expect(deps.cacheStats().country.entries).toBeGreaterThan(0);
    expect(gameData.cacheStats().eventsByCountry.entries).toBeGreaterThan(0);
  });
});
