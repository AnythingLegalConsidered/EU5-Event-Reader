import { describe, expect, it } from 'vitest';
import { ParadoxParser } from '../parsers/paradox-parser';
import { Tokenizer } from '../parsers/tokenizer';

const tokenizer = new Tokenizer();
const parser = new ParadoxParser();

describe('ParadoxParser', () => {
  it('parses nested blocks', () => {
    const tokens = tokenizer.tokenize('root = { child = { leaf = 1 } }');
    const ast = parser.parse(tokens);
    expect(ast.children?.[0]?.children?.[0]?.children?.[0]?.key).toBe('leaf');
  });

  it('groups repeated keys into arrays', () => {
    const tokens = tokenizer.tokenize('option = { id = 1 } option = { id = 2 }');
    const ast = parser.parse(tokens);
    const optionNode = ast.children?.find(c => c.key === 'option');
    expect(optionNode?.type).toBe('array');
    expect(optionNode?.children?.length).toBe(2);
  });

  it('throws on unexpected token', () => {
    const tokens = tokenizer.tokenize('= bad');
    expect(() => parser.parse(tokens)).toThrow();
  });
});
