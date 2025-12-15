import { parentPort } from 'worker_threads';
import { Tokenizer } from '../parsers/tokenizer';
import { ParadoxParser } from '../parsers/paradox-parser';
import { EventExtractor } from '../parsers/event-extractor';

const tokenizer = new Tokenizer();
const parser = new ParadoxParser();
const extractor = new EventExtractor();

type ParseMessage = { id: string; content: string };
type ParseResult = { id: string; ok: true; events: unknown } | { id: string; ok: false; error: string };

if (!parentPort) {
  throw new Error('parser.worker must be run as a worker thread');
}

parentPort.on('message', (msg: ParseMessage) => {
  try {
    const tokens = tokenizer.tokenize(msg.content);
    const ast = parser.parse(tokens);
    const events = extractor.extract(ast);
    const result: ParseResult = { id: msg.id, ok: true, events };
    parentPort!.postMessage(result);
  } catch (error: any) {
    const result: ParseResult = {
      id: msg.id,
      ok: false,
      error: error?.stack ?? String(error)
    };
    parentPort!.postMessage(result);
  }
});
