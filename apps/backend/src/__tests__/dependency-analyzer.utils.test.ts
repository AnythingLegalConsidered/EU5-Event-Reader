import { describe, expect, it } from 'vitest';
import {
  extractEventCalls,
  extractEventReferences,
  extractFlags,
  extractFlagCommands,
  extractTemporalConditions,
  flattenTriggerConditions
} from '../utils/dependency-analyzer';
import { EventTriggerCondition } from '@shared';

describe('dependency analyzer utils', () => {
  const nestedCondition: EventTriggerCondition = {
    and: [
      { condition: 'has_country_flag', parameters: { value: 'eng_conquest' } },
      {
        or: [
          { condition: 'years_passed', parameters: { value: 50 } },
          { condition: 'has_fired_event', parameters: { value: 'flavor_fra.12' } }
        ]
      },
      { not: { condition: 'has_global_flag', parameters: { value: 'world_ready' } } }
    ]
  };

  it('flattens nested trigger conditions with paths', () => {
    const flattened = flattenTriggerConditions(nestedCondition);
    const paths = flattened.map(item => item.path);

    expect(paths).toEqual([
      'root.and[0]',
      'root.and[1].or[0]',
      'root.and[1].or[1]',
      'root.and[2].not'
    ]);
  });

  it('extracts flag conditions including nested and not nodes', () => {
    const flags = extractFlags(nestedCondition);
    const values = flags.map(item => item.condition.parameters?.value);

    expect(values).toContain('eng_conquest');
    expect(values).toContain('world_ready');
    expect(flags).toHaveLength(2);
  });

  it('extracts flags from array values without duplicates', () => {
    const condition: EventTriggerCondition = {
      condition: 'has_country_flag',
      parameters: { value: ['flag_a', 'flag_b', 'flag_a'] }
    };

    const flags = extractFlags(condition);
    const values = flags.map(item => item.condition.parameters?.value);

    expect(values.sort()).toEqual(['flag_a', 'flag_b']);
  });

  it('extracts temporal conditions', () => {
    const temporal = extractTemporalConditions(nestedCondition);
    expect(temporal).toHaveLength(1);
    expect(temporal[0]?.condition.condition).toBe('years_passed');
  });

  it('extracts absolute date temporal conditions', () => {
    const condition: EventTriggerCondition = {
      condition: 'date',
      parameters: { value: '1500.1.1' }
    };

    const temporal = extractTemporalConditions(condition);
    expect(temporal).toHaveLength(1);
    expect(temporal[0]?.condition.parameters?.value).toBe('1500.1.1');
  });

  it('extracts event references from values and event-like conditions', () => {
    const condition: EventTriggerCondition = {
      or: [
        { condition: 'has_fired_event', parameters: { value: 'flavor_fra.12' } },
        { condition: 'random_check', parameters: { value: 'flavor_tur.1' } }
      ]
    };

    const events = extractEventReferences(condition);
    const ids = events.map(item => item.condition.parameters?.value);

    expect(ids.sort()).toEqual(['flavor_fra.12', 'flavor_tur.1']);
  });

  it('extracts flag commands from paradox values', () => {
    const value = {
      immediate: {
        set_country_flag: 'eng_ready',
        nested: { set_global_flag: ['world_a', 'world_a', 'world_b'] }
      }
    } as any;

    const flags = extractFlagCommands(value, 'immediate');
    const keys = flags.map(f => f.value).sort();
    expect(keys).toEqual(['eng_ready', 'world_a', 'world_b']);
    expect(flags.every(f => f.path.includes('set'))).toBe(true);
  });

  it('extracts event calls from paradox values', () => {
    const value = {
      option: {
        effect: {
          country_event: { id: 'flavor_fra.2' },
          event: ['flavor_eng.10']
        }
      }
    } as any;

    const calls = extractEventCalls(value, 'options[0].effects');
    const targets = calls.map(c => c.targetId).sort();
    expect(targets).toEqual(['flavor_eng.10', 'flavor_fra.2']);
  });
});
