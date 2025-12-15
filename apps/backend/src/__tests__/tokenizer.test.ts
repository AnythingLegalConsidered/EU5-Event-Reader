import { describe, expect, it } from 'vitest';
import { Tokenizer } from '../parsers/tokenizer';

const tokenizer = new Tokenizer();

describe('Tokenizer', () => {
  it('handles comments and ignores whitespace tokens', () => {
    const tokens = tokenizer.tokenize('# comment\nkey = value');
    expect(tokens.find(t => t.type === 'COMMENT')).toBeDefined();
    expect(tokens.map(t => t.type)).not.toContain('WHITESPACE');
  });

  it('parses strings with quotes and escapes', () => {
    const tokens = tokenizer.tokenize('title = "Hello \\\"World\\\""');
    const stringToken = tokens.find(t => t.type === 'STRING');
    expect(stringToken?.value).toBe('Hello "World"');
  });

  it('parses numbers and negatives', () => {
    const tokens = tokenizer.tokenize('a = -42 b = 3.14');
    const numbers = tokens.filter(t => t.type === 'NUMBER').map(t => t.value);
    expect(numbers).toEqual([-42, 3.14]);
  });

  it('parses dates', () => {
    const tokens = tokenizer.tokenize('start = 1444.11.11');
    const dateToken = tokens.find(t => t.type === 'DATE');
    expect(dateToken?.value).toBe('1444.11.11');
  });

  it('allows dotted identifiers', () => {
    const tokens = tokenizer.tokenize('id = flavor_tur.1');
    const idToken = tokens.find(t => t.type === 'IDENTIFIER' && t.value === 'flavor_tur.1');
    expect(idToken).toBeDefined();
  });
});
