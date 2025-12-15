export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'DATE'
  | 'BOOLEAN'
  | 'EQUALS'
  | 'OPEN_BRACE'
  | 'CLOSE_BRACE'
  | 'OPERATOR'
  | 'COMMENT'
  | 'WHITESPACE';

export type Token = {
  type: TokenType;
  value?: string | number | boolean;
  position: { line: number; column: number; index: number };
};

const isWhitespace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
const isLetter = (ch: string) => /[A-Za-z_]/.test(ch);
const isDigit = (ch: string) => /[0-9]/.test(ch);

export class Tokenizer {
  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    let line = 1;
    let column = 1;

    const push = (type: TokenType, value?: Token['value']) => {
      tokens.push({ type, value, position: { line, column, index: i } });
    };

    const advance = (count = 1) => {
      for (let j = 0; j < count; j += 1) {
        if (input[i] === '\n') {
          line += 1;
          column = 1;
        } else {
          column += 1;
        }
        i += 1;
      }
    };

    while (i < input.length) {
      const ch = input[i];

      // Comments (# ... end of line)
      if (ch === '#') {
        const startColumn = column;
        let comment = '';
        while (i < input.length && input[i] !== '\n') {
          comment += input[i];
          advance();
        }
        push('COMMENT', comment);
        continue;
      }

      // Whitespace
      if (isWhitespace(ch)) {
        const startColumn = column;
        let space = '';
        while (i < input.length && isWhitespace(input[i])) {
          space += input[i];
          advance();
        }
        push('WHITESPACE', space);
        continue;
      }

      // Braces
      if (ch === '{') {
        push('OPEN_BRACE', ch);
        advance();
        continue;
      }
      if (ch === '}') {
        push('CLOSE_BRACE', ch);
        advance();
        continue;
      }

      // Operators and equals
      if (ch === '=') {
        push('EQUALS', ch);
        advance();
        continue;
      }
      if (ch === '>' || ch === '<' || ch === '!') {
        const next = input[i + 1];
        if (next === '=') {
          push('OPERATOR', ch + next);
          advance(2);
        } else {
          push('OPERATOR', ch);
          advance();
        }
        continue;
      }

      // Strings (single or double quotes)
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let value = '';
        advance();
        while (i < input.length && input[i] !== quote) {
          if (input[i] === '\\') {
            const nextChar = input[i + 1];
            if (nextChar !== undefined) {
              value += nextChar;
              advance(2);
              continue;
            }
          }
          value += input[i];
          advance();
        }
        advance();
        push('STRING', value);
        continue;
      }

      // Numbers or dates
      if (isDigit(ch) || (ch === '-' && isDigit(input[i + 1]))) {
        let value = '';
        let hasDot = false;
        const start = i;
        while (i < input.length && (isDigit(input[i]) || input[i] === '.' || input[i] === '-')) {
          if (input[i] === '.') {
            hasDot = true;
          }
          value += input[i];
          advance();
        }
        // Detect date pattern YYYY.MM.DD
        if (value.split('.').length === 3 && value.split('.').every(part => part.length > 0)) {
          push('DATE', value);
        } else if (hasDot) {
          push('NUMBER', Number(value));
        } else {
          push('NUMBER', Number(value));
        }
        continue;
      }

      // Booleans
      if (input.startsWith('yes', i) || input.startsWith('no', i)) {
        const boolVal = input.startsWith('yes', i);
        push('BOOLEAN', boolVal);
        advance(boolVal ? 3 : 2);
        continue;
      }
      if (input.startsWith('true', i) || input.startsWith('false', i)) {
        const boolVal = input.startsWith('true', i);
        push('BOOLEAN', boolVal);
        advance(boolVal ? 4 : 5);
        continue;
      }

      // Identifiers
      if (isLetter(ch)) {
        let ident = '';
        while (
          i < input.length &&
          (isLetter(input[i]) || isDigit(input[i]) || input[i] === '_' || input[i] === '-' || input[i] === '.')
        ) {
          ident += input[i];
          advance();
        }
        push('IDENTIFIER', ident);
        continue;
      }

      throw new Error(`Unexpected character '${ch}' at ${line}:${column}`);
    }

    // Filter out whitespace tokens for downstream parsing simplicity
    return tokens.filter(t => t.type !== 'WHITESPACE');
  }

  async *tokenizeStream(chunks: AsyncIterable<string>): AsyncGenerator<Token[]> {
    let buffer = '';
    for await (const chunk of chunks) {
      buffer += chunk;
    }
    if (buffer.length === 0) return;
    yield this.tokenize(buffer);
  }
}
