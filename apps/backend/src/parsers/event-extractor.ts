import {
  EventTriggerCondition,
  ParsedEvent,
  ParadoxValue,
  RawParadoxBlock
} from '@shared';
import { ParadoxNode } from './paradox-parser';
import { toRawBlock } from './paradox-parser';

const blockValueToParadoxValue = (block: RawParadoxBlock): ParadoxValue => {
  if (!block.children || block.children.length === 0) {
    return block.value ?? null;
  }

  const grouped = new Map<string | undefined, RawParadoxBlock[]>();
  for (const child of block.children as RawParadoxBlock[]) {
    const key = child.key;
    const existing = grouped.get(key) ?? [];
    existing.push(child);
    grouped.set(key, existing);
  }

  const result: Record<string, ParadoxValue> = {};
  for (const [key, blocks] of grouped.entries()) {
    if (!key) continue;
    if (blocks.length === 1) {
      result[key] = blockValueToParadoxValue(blocks[0] as RawParadoxBlock);
    } else {
      result[key] = (blocks as RawParadoxBlock[]).map((b: RawParadoxBlock) => blockValueToParadoxValue(b));
    }
  }

  return result;
};

const toCondition = (block: RawParadoxBlock): EventTriggerCondition => {
  const key = block.key?.toLowerCase();
  if (key === 'and') {
    return { and: (block.children ?? []).map((child: RawParadoxBlock) => toCondition(child)) };
  }
  if (key === 'or') {
    return { or: (block.children ?? []).map((child: RawParadoxBlock) => toCondition(child)) };
  }
  if (key === 'not' && block.children && block.children[0]) {
    return { not: toCondition(block.children[0] as RawParadoxBlock) };
  }

  const operator = block.operator ?? '=';
  const value = block.children ? blockValueToParadoxValue(block) : block.value ?? null;
  return {
    condition: block.key,
    parameters: { op: operator, value } as Record<string, ParadoxValue>
  };
};

const findBlocks = (blocks: RawParadoxBlock[], key: string) =>
  blocks.filter((b: RawParadoxBlock) => b.key?.toLowerCase() === key.toLowerCase());

const extractScalar = (blocks: RawParadoxBlock[], key: string): ParadoxValue | undefined => {
  const found = findBlocks(blocks, key)[0];
  if (!found) return undefined;
  if (found.children && found.children.length > 0) {
    return blockValueToParadoxValue(found);
  }
  return found.value;
};

const extractBoolean = (blocks: RawParadoxBlock[], key: string): boolean | undefined => {
  const val = extractScalar(blocks, key);
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'yes' || val === 'true' || val === '1';
  if (typeof val === 'number') return val !== 0;
  return undefined;
};

const extractNumber = (blocks: RawParadoxBlock[], key: string): number | undefined => {
  const val = extractScalar(blocks, key);
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return val;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const blocksToOptions = (blocks: RawParadoxBlock[]): ParsedEvent['options'] => {
  const optionBlocks = findBlocks(blocks, 'option');
  return optionBlocks.map((optionBlock: RawParadoxBlock) => {
    const children = optionBlock.children ?? [];
    const triggerBlocks = findBlocks(children, 'trigger');
    const effectsBlocks = findBlocks(children, 'effect');

    return {
      id: extractScalar(children, 'id') as string | number | undefined,
      name: (extractScalar(children, 'name') as string | undefined) ?? undefined,
      title: extractScalar(children, 'title') as string | undefined,
      desc: extractScalar(children, 'desc') as string | undefined,
      ai_chance: extractNumber(children, 'ai_chance'),
      trigger: triggerBlocks[0] ? toCondition(triggerBlocks[0]) : undefined,
      effects: effectsBlocks.length > 0 ? blockValueToParadoxValue({ children: effectsBlocks }) : undefined
    };
  });
};

export class EventExtractor {
  extract(ast: ParadoxNode): ParsedEvent[] {
    const raw = toRawBlock(ast);
    const children = raw.children ?? [];

    const namespaceBlock = findBlocks(children, 'namespace')[0];
    const namespace = namespaceBlock?.value as string | undefined;

    const eventBlocks = children.filter(block => {
      const key = block.key?.toLowerCase() ?? '';
      return key.endsWith('_event') || key === 'event' || key === 'country_event' || key === 'province_event';
    });

    return eventBlocks.map(block => this.toParsedEvent(block, namespace));
  }

  private toParsedEvent(block: RawParadoxBlock, namespace?: string): ParsedEvent {
    const children = block.children ?? [];
    const triggerBlock = findBlocks(children, 'trigger')[0];
    const immediateBlock = findBlocks(children, 'immediate')[0];

    return {
      namespace,
      id: extractScalar(children, 'id') as string | number,
      title: extractScalar(children, 'title') as string | undefined,
      desc: extractScalar(children, 'desc') as string | undefined,
      picture: extractScalar(children, 'picture') as string | undefined,
      trigger: triggerBlock ? toCondition(triggerBlock) : undefined,
      immediate: immediateBlock ? blockValueToParadoxValue(immediateBlock) : undefined,
      options: blocksToOptions(children),
      is_triggered_only: extractBoolean(children, 'is_triggered_only'),
      fire_only_once: extractBoolean(children, 'fire_only_once'),
      mean_time_to_happen: extractScalar(children, 'mean_time_to_happen'),
      hidden: extractBoolean(children, 'hidden'),
      major: extractBoolean(children, 'major')
    };
  }
}
