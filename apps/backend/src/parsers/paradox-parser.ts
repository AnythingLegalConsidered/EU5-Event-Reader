import { ParadoxValue, RawParadoxBlock } from '@shared';
import { Token, TokenType } from './tokenizer';

export type ParadoxNodeType = 'object' | 'array' | 'scalar';

export type ParadoxNode = {
  type: ParadoxNodeType;
  key?: string;
  operator?: string;
  value?: ParadoxValue;
  children?: ParadoxNode[];
};

export class ParadoxParser {
  private tokens: Token[] = [];
  private index = 0;

  parse(tokens: Token[]): ParadoxNode {
    this.tokens = tokens.filter(t => t.type !== 'COMMENT');
    this.index = 0;
    const children = this.parseObject();
    return { type: 'object', children };
  }

  private parseObject(): ParadoxNode[] {
    const children: ParadoxNode[] = [];

    while (!this.isAtEnd() && !this.match('CLOSE_BRACE')) {
      const keyToken = this.peek();
      if (!keyToken || (keyToken.type !== 'IDENTIFIER' && keyToken.type !== 'STRING')) {
        throw new Error(`Expected identifier but got ${keyToken?.type ?? 'EOF'} at line ${keyToken?.position.line}`);
      }
      this.advance();
      const key = String(keyToken.value);

      let operator: string | undefined;
      // Optional equals or operator
      if (this.check('EQUALS')) {
        operator = '=';
        this.advance();
      } else if (this.check('OPERATOR')) {
        operator = String(this.peek()?.value ?? '');
        this.advance();
      }

      let node: ParadoxNode;
      if (this.check('OPEN_BRACE')) {
        this.advance();
        const nested = this.parseObject();
        this.consume('CLOSE_BRACE');
        node = { type: 'object', key, operator, children: nested };
      } else {
        const valueToken = this.peek();
        if (!valueToken) {
          throw new Error(`Missing value for key '${key}'`);
        }
        this.advance();
        node = { type: 'scalar', key, operator: operator ?? '=', value: this.tokenToValue(valueToken) };
      }

      this.addChild(children, node);
    }

    return children;
  }

  private addChild(children: ParadoxNode[], node: ParadoxNode) {
    const existingIndex = children.findIndex(c => c.key === node.key);
    if (existingIndex === -1) {
      children.push(node);
      return;
    }

    const existing = children[existingIndex];
    if (existing.type === 'array') {
      existing.children = existing.children ?? [];
      existing.children.push(node);
      return;
    }

    children[existingIndex] = {
      type: 'array',
      key: node.key,
      children: [existing, node]
    };
  }

  private tokenToValue(token: Token): ParadoxValue {
    if (token.type === 'STRING' || token.type === 'IDENTIFIER' || token.type === 'DATE') {
      return String(token.value);
    }
    if (token.type === 'NUMBER') {
      return Number(token.value);
    }
    if (token.type === 'BOOLEAN') {
      return Boolean(token.value);
    }
    return String(token.value ?? '');
  }

  private isAtEnd() {
    return this.index >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private advance(): Token | undefined {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private check(type: TokenType) {
    const token = this.peek();
    return token?.type === type;
  }

  private match(type: TokenType) {
    if (this.check(type)) {
      return true;
    }
    return false;
  }

  private consume(type: TokenType) {
    if (!this.check(type)) {
      const token = this.peek();
      throw new Error(`Expected ${type} but found ${token?.type ?? 'EOF'}`);
    }
    this.advance();
  }
}

export const toRawBlock = (node: ParadoxNode): RawParadoxBlock => {
  if (node.type === 'scalar') {
    return { key: node.key, operator: node.operator, value: node.value };
  }

  if (node.type === 'array') {
    return {
      key: node.key,
      operator: node.operator,
      children: node.children?.map(child => toRawBlock(child))
    };
  }

  return {
    key: node.key,
    operator: node.operator,
    children: node.children?.map(child => toRawBlock(child))
  };
};
