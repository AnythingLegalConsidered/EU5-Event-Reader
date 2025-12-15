import { ParadoxValue, EventTriggerCondition } from '@shared';

const indentText = (level: number) => '  '.repeat(level);
const MAX_DEPTH = 5;

export const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
};

export const formatEventId = (namespace?: string, id?: string | number) => {
  if (!namespace && id === undefined) return '';
  return `${namespace ?? 'event'}.${id ?? ''}`;
};

export const formatParadoxValue = (value: ParadoxValue, indent = 0): string => {
  if (indent > MAX_DEPTH) return `${indentText(indent)}…`;

  if (value === null) return `${indentText(indent)}null`;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${indentText(indent)}${value}`;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => `${indentText(indent)}- ${formatParadoxValue(item, indent + 1).trimStart()}`)
      .join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `${indentText(indent)}${key}:\n${formatParadoxValue(val, indent + 1)}`)
      .join('\n');
  }

  return `${indentText(indent)}${String(value)}`;
};

export const formatTrigger = (trigger?: EventTriggerCondition, indent = 0): string => {
  if (!trigger) return '';
  if (indent > MAX_DEPTH) return `${indentText(indent)}…`;

  const lines: string[] = [];
  const pad = indentText(indent);

  if (trigger.and) {
    lines.push(`${pad}AND:`);
    trigger.and.forEach((child: EventTriggerCondition) => lines.push(formatTrigger(child, indent + 1)));
  }

  if (trigger.or) {
    lines.push(`${pad}OR:`);
    trigger.or.forEach((child: EventTriggerCondition) => lines.push(formatTrigger(child, indent + 1)));
  }

  if (trigger.not) {
    lines.push(`${pad}NOT:`);
    lines.push(formatTrigger(trigger.not, indent + 1));
  }

  if (trigger.condition) {
    lines.push(`${pad}• ${trigger.condition}`);
  }

  if (trigger.parameters) {
    lines.push(`${pad}parameters:`);
    lines.push(formatParadoxValue(trigger.parameters, indent + 1));
  }

  return lines.join('\n');
};
