import { describe, expect, it } from 'vitest';
import {
  buildTimelineData,
  extractTemporalDate,
  sortEventsByDate
} from '../timeline';
import { EventDependencyGraph, LocalizedEvent } from '@shared';

describe('timeline utilities', () => {
  it('extracts temporal date information from temporal dependency', () => {
    const dep = {
      type: 'temporal',
      key: '1500.1.1',
      details: 'date',
      sourceEventId: 'ns.1'
    } as any;

    const result = extractTemporalDate(dep);
    expect(result?.year).toBe(1500);
    expect(result?.date).toBe('1500.01.01');
    expect(result?.condition).toContain('date');
  });

  it('ignores years_passed temporal dependencies', () => {
    const dep = {
      type: 'temporal',
      key: 'years_passed=5',
      details: 'years_passed',
      sourceEventId: 'ns.1'
    } as any;

    const result = extractTemporalDate(dep);
    expect(result).toBeNull();
  });

  it('builds timeline data with incoming/outgoing dependencies', () => {
    const events: LocalizedEvent[] = [
      { namespace: 'ns', id: 1, localizedTitle: 'One' } as any,
      { namespace: 'ns', id: 2, localizedTitle: 'Two' } as any
    ];

    const graphs: EventDependencyGraph[] = [
      {
        eventId: 'ns.1',
        namespace: 'ns',
        dependencies: [
          { type: 'temporal', key: 'years_passed=5', details: 'years_passed', sourceEventId: 'ns.1' },
          { type: 'temporal', key: '1500', details: 'year', sourceEventId: 'ns.1' },
          { type: 'event_reference', key: 'ns.2', targetEventId: 'ns.2', sourceEventId: 'ns.1' }
        ]
      },
      {
        eventId: 'ns.2',
        namespace: 'ns',
        dependencies: [
          { type: 'temporal', key: '1510.5.1', details: 'date', sourceEventId: 'ns.2' },
          { type: 'temporal', key: '1512', details: 'year', sourceEventId: 'ns.2' }
        ]
      }
    ];

    const timeline = buildTimelineData(events, graphs);
    expect(timeline.events.length).toBe(2);
    const first = timeline.events[0];
    expect(first.eventId).toBe('ns.1');
    expect(first.dependencies.outgoing.some(d => d.type === 'event_reference')).toBe(true);
    const second = timeline.events[1];
    expect(second.dependencies.incoming.length).toBeGreaterThan(0);
    expect(second.temporalData?.date).toBe('1510.05.01');
    expect(timeline.dateRange.min).toBe(1500);
    expect(timeline.dateRange.max).toBe(1510);
  });

  it('sorts events by year then date', () => {
    const events = [
      { eventId: 'a', temporalData: { year: 1505 }, dependencies: { incoming: [], outgoing: [] }, event: {} as any },
      { eventId: 'b', temporalData: { year: 1500, date: '1500.06.01' }, dependencies: { incoming: [], outgoing: [] }, event: {} as any },
      { eventId: 'c', temporalData: { year: 1500, date: '1500.02.01' }, dependencies: { incoming: [], outgoing: [] }, event: {} as any }
    ];

    const sorted = sortEventsByDate(events as any);
    expect(sorted.map(e => e.eventId)).toEqual(['c', 'b', 'a']);
  });
});
