import path from 'path';
import { describe, expect, it } from 'vitest';
import { readParadoxFile } from '../parsers/file-reader';

describe('File reader', () => {
  it('reads UTF-8/1252 content and normalizes newlines', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'encoding-test.txt');
    const content = await readParadoxFile(filePath);
    expect(content.includes('Événement')).toBe(true);
    expect(content.includes('\r\n')).toBe(false);
  });

  it('throws on missing file', async () => {
    await expect(readParadoxFile('non-existent.txt')).rejects.toThrow();
  });
});
