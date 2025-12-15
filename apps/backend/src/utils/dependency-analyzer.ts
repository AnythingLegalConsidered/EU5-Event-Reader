import { EventTriggerCondition, ParadoxValue } from '@shared';

export type FlattenedCondition = {
  path: string;
  condition: EventTriggerCondition;
};

const isComposite = (condition: EventTriggerCondition) =>
  !!(condition.and?.length || condition.or?.length || condition.not);

const collectStrings = (value: ParadoxValue): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
};

export const flattenTriggerConditions = (
  condition: EventTriggerCondition | undefined,
  path = 'root'
): FlattenedCondition[] => {
  if (!condition) return [];

  if (condition.and?.length) {
    return condition.and.flatMap((child, idx) =>
      flattenTriggerConditions(child, `${path}.and[${idx}]`)
    );
  }

  if (condition.or?.length) {
    return condition.or.flatMap((child, idx) => flattenTriggerConditions(child, `${path}.or[${idx}]`));
  }

  if (condition.not) {
    return flattenTriggerConditions(condition.not, `${path}.not`);
  }

  return [{ path, condition }];
};

export const extractFlags = (
  condition: EventTriggerCondition | undefined,
  basePath = 'root'
): FlattenedCondition[] => {
  const leaves = flattenTriggerConditions(condition, basePath);
  const result: FlattenedCondition[] = [];
  const seen = new Set<string>();

  for (const leaf of leaves) {
    const key = leaf.condition.condition?.toLowerCase() ?? '';
    if (!key.includes('flag')) continue;

    const values = collectStrings(leaf.condition.parameters?.value ?? null);
    if (values.length === 0) {
      const dedupeKey = `${key}|${leaf.path}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        result.push(leaf);
      }
      continue;
    }

    for (const val of values) {
      const dedupeKey = `${val}|${leaf.path}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      result.push({ ...leaf, condition: { ...leaf.condition, parameters: { ...(leaf.condition.parameters ?? {}), value: val } } });
    }
  }

  return result;
};

const TEMPORAL_KEYS = new Set([
  'years_passed',
  'months_passed',
  'days_passed',
  'year',
  'month',
  'day',
  'age',
  'date',
  'current_date'
]);

export const extractTemporalConditions = (
  condition: EventTriggerCondition | undefined,
  basePath = 'root'
): FlattenedCondition[] => {
  const leaves = flattenTriggerConditions(condition, basePath);
  return leaves.filter(leaf => TEMPORAL_KEYS.has((leaf.condition.condition ?? '').toLowerCase()));
};

const EVENT_ID_PATTERN = /^[a-z_]+\.\d+$/i;

export const extractEventReferences = (
  condition: EventTriggerCondition | undefined,
  basePath = 'root'
): FlattenedCondition[] => {
  const leaves = flattenTriggerConditions(condition, basePath);
  const result: FlattenedCondition[] = [];
  const seen = new Set<string>();

  for (const leaf of leaves) {
    const key = leaf.condition.condition ?? '';
    const values = collectStrings(leaf.condition.parameters?.value ?? null);
    const matchesKey = key.toLowerCase().includes('event') && EVENT_ID_PATTERN.test(values[0] ?? '');

    if (matchesKey && values[0]) {
      const dedupeKey = `${values[0]}|${leaf.path}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        result.push({ ...leaf, condition: { ...leaf.condition, parameters: { ...(leaf.condition.parameters ?? {}), value: values[0] } } });
      }
      continue;
    }

    for (const val of values) {
      if (!EVENT_ID_PATTERN.test(val)) continue;
      const dedupeKey = `${val}|${leaf.path}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      result.push({ ...leaf, condition: { ...leaf.condition, parameters: { ...(leaf.condition.parameters ?? {}), value: val } } });
    }
  }

  return result;
};

type TraverseContext = {
  path: string;
  key?: string;
};

const isObject = (value: ParadoxValue): value is Record<string, ParadoxValue> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const traverseParadoxValue = (
  value: ParadoxValue,
  path: string,
  visitor: (ctx: TraverseContext, value: ParadoxValue) => void
) => {
  visitor({ path }, value);
  if (Array.isArray(value)) {
    value.forEach((item, idx) => traverseParadoxValue(item, `${path}[${idx}]`, visitor));
    return;
  }
  if (isObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      traverseParadoxValue(child, `${path}.${key}`, v => visitor({ path: `${path}.${key}`, key }, v));
    });
  }
};

const FLAG_COMMANDS = new Set(['set_country_flag', 'set_global_flag', 'clr_country_flag', 'clr_global_flag']);

export const extractFlagCommands = (value: ParadoxValue | undefined, basePath = 'root'): Array<{
  path: string;
  key: string;
  value: string;
}> => {
  if (value === undefined || value === null) return [];
  const results: Array<{ path: string; key: string; value: string }> = [];
  const seen = new Set<string>();

  traverseParadoxValue(value, basePath, (ctx, current) => {
    if (!ctx.key || !FLAG_COMMANDS.has(ctx.key)) return;
    const values = collectStrings(current);
    for (const val of values) {
      const dedupe = `${ctx.path}|${val}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      results.push({ path: ctx.path, key: ctx.key, value: val });
    }
  });

  return results;
};

const EVENT_CALL_KEYS = new Set(['country_event', 'province_event', 'event', 'character_event']);

export const extractEventCalls = (value: ParadoxValue | undefined, basePath = 'root'): Array<{
  path: string;
  key: string;
  targetId: string;
}> => {
  if (value === undefined || value === null) return [];
  const results: Array<{ path: string; key: string; targetId: string }> = [];
  const seen = new Set<string>();

  traverseParadoxValue(value, basePath, (ctx, current) => {
    if (!ctx.key || !EVENT_CALL_KEYS.has(ctx.key)) return;

    if (isObject(current) && current.id) {
      const ids = collectStrings(current.id as ParadoxValue);
      ids.forEach(id => {
        const dedupe = `${ctx.path}|${id}`;
        if (seen.has(dedupe)) return;
        seen.add(dedupe);
        results.push({ path: `${ctx.path}.id`, key: ctx.key, targetId: id });
      });
    } else {
      const ids = collectStrings(current);
      ids.forEach(id => {
        const dedupe = `${ctx.path}|${id}`;
        if (seen.has(dedupe)) return;
        seen.add(dedupe);
        results.push({ path: ctx.path, key: ctx.key, targetId: id });
      });
    }
  });

  return results;
};
