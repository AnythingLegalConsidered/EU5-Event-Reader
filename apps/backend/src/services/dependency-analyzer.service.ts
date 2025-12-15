import { EventDependency, EventDependencyGraph, ParsedEvent } from '@shared';
import { GameDataSource } from '../config/game-data';
import { GameDataService } from './game-data.service';
import { CacheService } from './cache.service';
import {
  extractEventCalls,
  extractEventReferences,
  extractFlagCommands,
  extractFlags,
  extractTemporalConditions
} from '../utils';

const resolveSource = (source?: GameDataSource): GameDataSource =>
  source === 'local' || process.env.DEFAULT_SOURCE === 'local' ? 'local' : 'vanilla';

const formatEventId = (event: ParsedEvent): string => {
  const ns = event.namespace ?? 'event';
  return `${ns}.${String(event.id)}`;
};

const extractCountryTag = (eventId: string): string | null => {
  const match = eventId.match(/flavor_([a-z]{3})/i);
  return match ? match[1].toUpperCase() : null;
};

export class DependencyAnalyzerService {
  private countryCache = new CacheService<EventDependencyGraph[]>({ cacheDir: '.cache/deps-country' });
  private eventCache = new CacheService<EventDependencyGraph>({ cacheDir: '.cache/deps-event' });
  private ready: Promise<void>;

  constructor(private gameDataService: GameDataService) {
    this.ready = Promise.all([this.countryCache.init(), this.eventCache.init()]).then(() => undefined);
  }

  async getDependenciesByCountry(
    countryTag: string,
    source?: GameDataSource
  ): Promise<EventDependencyGraph[]> {
    await this.ready;
    const normalizedTag = countryTag.toUpperCase();
    const resolvedSource = resolveSource(source);

    const key = `${resolvedSource}:${normalizedTag}`;
    const cached = await this.countryCache.get(key);
    if (cached) return cached;

    const events = await this.gameDataService.getEventsByCountry(normalizedTag, resolvedSource);
    const allEvents = await this.gameDataService.getAllEvents(resolvedSource);
    const graphs = this.buildGraphs(events, allEvents, resolvedSource);
    await this.countryCache.set(key, graphs, null);
    graphs.forEach(graph => this.cacheEventGraph(graph, resolvedSource));
    return graphs;
  }

  async getDependenciesForEvent(
    eventId: string,
    source?: GameDataSource
  ): Promise<EventDependencyGraph | null> {
    await this.ready;
    const resolvedSource = resolveSource(source);

    const key = `${resolvedSource}:${eventId.toLowerCase()}`;
    const cached = await this.eventCache.get(key);
    if (cached) return cached;

    const event = await this.gameDataService.getEventById(eventId, resolvedSource);
    if (!event) return null;

    const countryTag = extractCountryTag(eventId);
    if (countryTag) {
      const countryGraphs = await this.getDependenciesByCountry(countryTag, resolvedSource);
      const found = countryGraphs.find(graph => graph.eventId.toLowerCase() === eventId.toLowerCase());
      if (found) return found;
    }

    const allEvents = await this.gameDataService.getAllEvents(resolvedSource);
    const graph = this.buildGraph(event, new Map(allEvents.map(evt => [formatEventId(evt).toLowerCase(), evt])), resolvedSource);
    await this.cacheEventGraph(graph, resolvedSource);
    return graph;
  }

  async clearCache(_source?: GameDataSource) {
    await Promise.all([this.countryCache.clear(), this.eventCache.clear()]);
  }

  cacheStats() {
    return {
      country: this.countryCache.stats(),
      event: this.eventCache.stats()
    };
  }

  private async cacheEventGraph(graph: EventDependencyGraph, source: GameDataSource) {
    await this.eventCache.set(`${source}:${graph.eventId.toLowerCase()}`, graph, null);
  }

  private buildGraphs(events: ParsedEvent[], allEvents: ParsedEvent[], source: GameDataSource): EventDependencyGraph[] {
    const index = new Map(allEvents.map(event => [formatEventId(event).toLowerCase(), event] as const));
    return events.map(event => this.buildGraph(event, index, source));
  }

  private buildGraph(
    event: ParsedEvent,
    eventIndex: Map<string, ParsedEvent>,
    source: GameDataSource
  ): EventDependencyGraph {
    const eventId = formatEventId(event);
    const dependencies: EventDependency[] = [];
    const dedupe = new Set<string>();

    const addDependency = (dep: EventDependency) => {
      const key = `${dep.type}|${dep.key}|${dep.path ?? 'root'}`;
      if (dedupe.has(key)) return;
      dedupe.add(key);
      dependencies.push(dep);
    };

    const addFromConditions = (hits: ReturnType<typeof extractFlags>, type: EventDependency['type']) => {
      for (const hit of hits) {
        const value = String(hit.condition.parameters?.value ?? hit.condition.condition ?? 'unknown');
        addDependency({
          type,
          key: value,
          sourceEventId: eventId,
          path: hit.path,
          details: hit.condition.condition ?? undefined,
          targetEventId: type === 'event_reference' ? value : undefined,
          isMissing: type === 'event_reference' ? !eventIndex.has(value.toLowerCase()) : undefined
        });
      }
    };

    const addFlagCommands = (hits: ReturnType<typeof extractFlagCommands>) => {
      for (const hit of hits) {
        addDependency({
          type: 'flag',
          key: hit.value,
          sourceEventId: eventId,
          path: hit.path,
          details: hit.key
        });
      }
    };

    const addEventCalls = (hits: ReturnType<typeof extractEventCalls>) => {
      for (const hit of hits) {
        addDependency({
          type: 'event_reference',
          key: hit.targetId,
          sourceEventId: eventId,
          path: hit.path,
          details: hit.key,
          targetEventId: hit.targetId,
          isMissing: !eventIndex.has(hit.targetId.toLowerCase())
        });
      }
    };

    addFromConditions(extractFlags(event.trigger, 'trigger'), 'flag');
    addFromConditions(extractTemporalConditions(event.trigger, 'trigger'), 'temporal');
    addFromConditions(extractEventReferences(event.trigger, 'trigger'), 'event_reference');

    addFlagCommands(extractFlagCommands(event.immediate, 'immediate'));
    addEventCalls(extractEventCalls(event.immediate, 'immediate'));

    event.options?.forEach((option, idx) => {
      if (option.trigger) {
        const basePath = `options[${idx}].trigger`;
        addFromConditions(extractFlags(option.trigger, basePath), 'flag');
        addFromConditions(extractTemporalConditions(option.trigger, basePath), 'temporal');
        addFromConditions(extractEventReferences(option.trigger, basePath), 'event_reference');
      }

      if (option.effects) {
        const effectsPath = `options[${idx}].effects`;
        addFlagCommands(extractFlagCommands(option.effects, effectsPath));
        addEventCalls(extractEventCalls(option.effects, effectsPath));
      }
    });

    return { eventId, namespace: event.namespace, dependencies };
  }
}
