import fs from 'fs/promises';
import path from 'path';
import { LocalizedEvent, ParsedEvent, SupportedLanguage, Country } from '@shared';
import { EventParserService } from './event-parser.service';
import { LocalizationService } from './localization.service';
import { gameDataConfig, GameDataSource, getSourcePath } from '../config/game-data';
import { localizationConfig } from '../config/localization';
import { CacheService } from './cache.service';

export class GameDataService {
  private eventsCache = new CacheService<ParsedEvent[]>({ cacheDir: path.join(process.cwd(), '.cache', 'events-by-country') });
  private countriesCache = new CacheService<Country[]>({ cacheDir: path.join(process.cwd(), '.cache', 'countries') });
  private allEventsCache = new CacheService<ParsedEvent[]>({ cacheDir: path.join(process.cwd(), '.cache', 'events-all') });
  private defaultLanguage: SupportedLanguage = localizationConfig.defaultLanguage;
  private fallbackLanguage: SupportedLanguage = localizationConfig.fallbackLanguage;
  private ready: Promise<void>;

  constructor(
    private eventParser: EventParserService,
    private localizationService: LocalizationService,
    private config = gameDataConfig
  ) {
    this.ready = Promise.all([
      this.eventsCache.init(),
      this.countriesCache.init(),
      this.allEventsCache.init()
    ]).then(() => undefined);
  }

  async discoverCountries(source: GameDataSource = this.config.defaultSource): Promise<Country[]> {
    await this.ready;
    const cached = await this.countriesCache.get(source);
    if (cached) return cached;

    const eventsPath = getSourcePath(source);
    const entries = await fs.readdir(eventsPath, { withFileTypes: true });
    const countries: Country[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const match = entry.name.match(/flavor_([a-z]{3})\.txt$/i);
      if (!match) continue;
      const tag = match[1].toUpperCase();
      const namespace = `flavor_${tag.toLowerCase()}`;
      const events = await this.parseCountryEvents(tag, source).catch(() => [] as ParsedEvent[]);
      const name = this.localizationService.resolve(`${tag}_name`, {
        language: this.defaultLanguage,
        fallbackLanguage: this.fallbackLanguage,
        resolveVariables: true
      });
      countries.push({ tag, name, eventCount: events.length, namespace });
    }

    countries.sort((a, b) => a.tag.localeCompare(b.tag));
    await this.countriesCache.set(source, countries, null);
    return countries;
  }

  async getEventsByCountry(countryTag: string, source: GameDataSource = this.config.defaultSource): Promise<ParsedEvent[]> {
    const tag = countryTag.toUpperCase();
    await this.ready;
    const key = `${source}:${tag}`;
    const cached = await this.eventsCache.get(key);
    if (cached) return cached;

    const events = await this.parseCountryEvents(tag, source);
    await this.eventsCache.set(key, events, null);
    return events;
  }

  async getAllEvents(source: GameDataSource = this.config.defaultSource): Promise<ParsedEvent[]> {
    await this.ready;
    const cached = await this.allEventsCache.get(source);
    if (cached) return cached;

    const eventsPath = getSourcePath(source);
    const events = await this.eventParser.parseEventDirectory(eventsPath);
    await this.allEventsCache.set(source, events, null);
    return events;
  }

  async getLocalizedEventsByCountry(
    countryTag: string,
    options: { source?: GameDataSource; language?: SupportedLanguage; fallbackLanguage?: SupportedLanguage }
  ): Promise<LocalizedEvent[]> {
    const events = await this.getEventsByCountry(countryTag, options.source ?? this.config.defaultSource);
    return events.map(evt =>
      this.localizationService.resolveEvent(evt, {
        language: options.language ?? this.defaultLanguage,
        fallbackLanguage: options.fallbackLanguage ?? this.fallbackLanguage,
        resolveVariables: true
      })
    );
  }

  async getEventById(
    eventId: string,
    source: GameDataSource = this.config.defaultSource
  ): Promise<ParsedEvent | null> {
    const match = eventId.match(/^([a-z_]+)\.(\d+)$/i);
    if (!match) return null;
    const namespace = match[1].toLowerCase();
    const tagMatch = namespace.match(/flavor_([a-z]{3})/i);
    const tag = tagMatch ? tagMatch[1].toUpperCase() : undefined;
    if (!tag) return null;
    const events = await this.getEventsByCountry(tag, source);
    const found = events.find(evt => `${namespace}.${evt.id}`.toLowerCase() === eventId.toLowerCase());
    return found ?? null;
  }

  async clearCache(_source?: GameDataSource) {
    await Promise.all([this.eventsCache.clear(), this.countriesCache.clear(), this.allEventsCache.clear()]);
  }

  cacheStats() {
    return {
      eventsByCountry: this.eventsCache.stats(),
      countries: this.countriesCache.stats(),
      allEvents: this.allEventsCache.stats()
    };
  }

  private async parseCountryEvents(tag: string, source: GameDataSource): Promise<ParsedEvent[]> {
    const eventsPath = getSourcePath(source);
    const filePath = path.join(eventsPath, `flavor_${tag.toLowerCase()}.txt`);
    const events = await this.eventParser.parseEventFileAsync(filePath);
    const namespacePrefix = `flavor_${tag.toLowerCase()}`;
    return events.filter(evt => (evt.namespace ?? '').startsWith(namespacePrefix));
  }
}
