import path from 'path';
import { describe, expect, it } from 'vitest';
import { EventExtractor } from '../parsers/event-extractor';
import { ParadoxParser } from '../parsers/paradox-parser';
import { Tokenizer } from '../parsers/tokenizer';
import { readParadoxFile } from '../parsers/file-reader';

const tokenizer = new Tokenizer();
const parser = new ParadoxParser();
const extractor = new EventExtractor();

const loadAst = async (fixtureName: string) => {
  const filePath = path.join(__dirname, 'fixtures', fixtureName);
  const content = await readParadoxFile(filePath);
  const tokens = tokenizer.tokenize(content);
  return parser.parse(tokens);
};

describe('EventExtractor', () => {
  it('extracts simple event with namespace and option', async () => {
    const ast = await loadAst('simple-event.txt');
    const events = extractor.extract(ast);
    expect(events.length).toBe(1);
    const evt = events[0];
    expect(evt.namespace).toBe('test');
    expect(evt.options?.[0]?.name).toBe('simple_option');
  });

  it('extracts triggers, options, and flags from complex event', async () => {
    const ast = await loadAst('complex-event.txt');
    const events = extractor.extract(ast);
    expect(events[0].is_triggered_only).toBe(true);
    expect(events[0].options?.length).toBe(2);
    expect(events[0].trigger?.and).toBeDefined();
    const orBranch = events[0].trigger?.and?.find(c => c.or)?.or;
    const stabilityCond = orBranch?.find(c => c.condition === 'stability');
    expect(stabilityCond?.parameters).toEqual({ op: '>', value: 0 });
  });

  it('preserves dotted identifiers for events and options', async () => {
    const ast = await loadAst('dotted-id.txt');
    const events = extractor.extract(ast);
    expect(events[0].id).toBe('flavor_tur.1');
    expect(events[0].options?.[0]?.id).toBe('opt.1');
  });
});
