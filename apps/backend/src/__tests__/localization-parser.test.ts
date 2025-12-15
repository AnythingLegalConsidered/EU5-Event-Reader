import path from 'path';
import { describe, expect, it } from 'vitest';
import { LocalizationParser } from '../parsers/localization-parser';
import { readParadoxFile } from '../parsers/file-reader';

const parser = new LocalizationParser();
const fixtures = path.join(__dirname, 'fixtures', 'localization');

const readFixture = (name: string) => readParadoxFile(path.join(fixtures, name));

describe('LocalizationParser', () => {
  it('parses a simple english file', async () => {
    const content = await readFixture('events_l_english.yml');
    const entries = parser.parse(content, 'events_l_english.yml');
    expect(entries[0].language).toBe('english');
    expect(entries.find(e => e.key === 'event.100.title')?.value).toBe('Simple Title');
  });

  it('parses escaped quotes', () => {
    const content = 'l_english:\n key: "He said \"hi\""';
    const entries = parser.parse(content, 'inline');
    expect(entries[0].value).toBe('He said "hi"');
  });

  it('throws on invalid header', () => {
    expect(() => parser.parse('invalid header', 'bad.yml')).toThrow();
  });

  it('throws on invalid entry', () => {
    const content = 'l_english:\ninvalid line';
    expect(() => parser.parse(content, 'bad.yml')).toThrow();
  });
});
