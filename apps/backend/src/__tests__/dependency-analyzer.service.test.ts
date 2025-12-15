import { describe, expect, it } from 'vitest';
import { DependencyAnalyzerService } from '../services/dependency-analyzer.service';
import { ParsedEvent } from '@shared';

class FakeGameDataService {
  constructor(private events: ParsedEvent[]) {}

  async getEventsByCountry() {
    return this.events;
  }

  async getEventById(id: string) {
    const found = this.events.find(evt => `${evt.namespace}.${evt.id}`.toLowerCase() === id.toLowerCase());
    return found ?? null;
  }

  async getAllEvents() {
    return this.events;
  }
}

describe('DependencyAnalyzerService', () => {
  const events: ParsedEvent[] = [
    {
      namespace: 'flavor_eng',
      id: 10,
      title: 'Event ENG',
      trigger: { condition: 'has_country_flag', parameters: { value: 'eng_ready' } },
      immediate: {
        set_country_flag: 'eng_fired',
        country_event: { id: 'flavor_fra.2' }
      },
      options: [
        {
          trigger: { condition: 'has_fired_event', parameters: { value: 'flavor_fra.1' } },
          effects: { set_global_flag: 'world_shared', event: ['missing.99'] }
        }
      ]
    },
    {
      namespace: 'flavor_fra',
      id: 1,
      title: 'Event FRA',
      trigger: { condition: 'years_passed', parameters: { value: 5 } }
    },
    {
      namespace: 'flavor_fra',
      id: 2,
      title: 'Follow-up FRA'
    }
  ];

  const service = new DependencyAnalyzerService(new FakeGameDataService(events) as any);

  it('builds dependency graphs by country with flags, temporal, and event references', async () => {
    const graphs = await service.getDependenciesByCountry('ENG');

    expect(graphs).toHaveLength(2);

    const engGraph = graphs.find(graph => graph.eventId === 'flavor_eng.10');
    expect(engGraph).toBeDefined();
    expect(engGraph?.dependencies.find(dep => dep.type === 'flag' && dep.key === 'eng_ready')).toBeTruthy();
    expect(
      engGraph?.dependencies.find(dep => dep.type === 'event_reference' && dep.targetEventId === 'flavor_fra.1')?.isMissing
    ).toBe(false);
    expect(
      engGraph?.dependencies.find(dep => dep.type === 'event_reference' && dep.targetEventId === 'flavor_fra.2')?.isMissing
    ).toBe(false);
    expect(
      engGraph?.dependencies.find(dep => dep.type === 'flag' && dep.details?.includes('set_country_flag'))
    ).toBeTruthy();
    expect(
      engGraph?.dependencies.find(dep => dep.type === 'flag' && dep.key === 'world_shared')
    ).toBeTruthy();
    expect(
      engGraph?.dependencies.find(dep => dep.type === 'event_reference' && dep.targetEventId === 'missing.99')?.isMissing
    ).toBe(true);

    const fraGraph = graphs.find(graph => graph.eventId === 'flavor_fra.1');
    expect(fraGraph?.dependencies.find(dep => dep.type === 'temporal')).toBeTruthy();
  });

  it('returns a single dependency graph by event id', async () => {
    const graph = await service.getDependenciesForEvent('flavor_eng.10');

    expect(graph).not.toBeNull();
    expect(graph?.dependencies.some(dep => dep.type === 'flag')).toBe(true);
    expect(graph?.dependencies.some(dep => dep.type === 'event_reference')).toBe(true);
  });
});
