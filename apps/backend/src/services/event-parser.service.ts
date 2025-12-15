import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { Worker } from 'worker_threads';
import { randomUUID } from 'crypto';
import { ParsedEvent } from '@shared';
import { readParadoxFile, readParadoxFileChunked } from '../parsers/file-reader';
import { Tokenizer } from '../parsers/tokenizer';
import { ParadoxParser } from '../parsers/paradox-parser';
import { EventExtractor } from '../parsers/event-extractor';
import { CacheService } from './cache.service';

export class EventParserService {
  private tokenizer = new Tokenizer();
  private parser = new ParadoxParser();
  private extractor = new EventExtractor();
  private cache = new CacheService<ParsedEvent[]>({ cacheDir: path.join(process.cwd(), '.cache', 'events') });
  private enableAsync = process.env.ENABLE_ASYNC_PARSING !== 'false';
  private workerCount = Math.max(1, Math.min(4, Number(process.env.PARSER_WORKER_COUNT ?? os.cpus().length - 1)));
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private tasks = new Map<string, { resolve: (v: ParsedEvent[]) => void; reject: (e: Error) => void; worker: Worker }>();
  private ready: Promise<void>;
  private disposed = false;

  constructor() {
    this.ready = this.init();
  }

  private async init() {
    await this.cache.init();
    if (this.enableAsync) {
      this.spawnWorkers();
    }
  }

  private spawnWorkers() {
    const isProd = process.env.NODE_ENV === 'production';
    const ext = isProd ? 'js' : 'ts';
    const workerUrl = new URL(`../workers/parser.worker.${ext}`, import.meta.url);
    for (let i = 0; i < this.workerCount; i += 1) {
      const worker = new Worker(workerUrl, {
        workerData: {},
        execArgv: isProd ? undefined : ['--loader', 'tsx']
      });
      worker.on('message', (msg: any) => this.handleWorkerMessage(worker, msg));
      worker.on('error', err => this.handleWorkerError(worker, err));
      worker.on('exit', code => {
        this.tasks.forEach((task, id) => {
          if (task.worker === worker) {
            task.reject(new Error(`Worker exited (${code})`));
            this.tasks.delete(id);
          }
        });
        this.idleWorkers = this.idleWorkers.filter(w => w !== worker);
      });
      this.workers.push(worker);
      this.idleWorkers.push(worker);
    }
  }

  private handleWorkerMessage(worker: Worker, msg: any) {
    const task = msg && this.tasks.get(msg.id);
    if (!task) return;
    this.tasks.delete(msg.id);
    this.idleWorkers.push(worker);
    if (msg.ok) {
      task.resolve(msg.events as ParsedEvent[]);
    } else {
      task.reject(new Error(msg.error ?? 'Worker parsing failed'));
    }
  }

  private handleWorkerError(worker: Worker, err: Error) {
    this.idleWorkers = this.idleWorkers.filter(w => w !== worker);
    this.tasks.forEach((task, id) => {
      if (task.worker === worker) {
        task.reject(err);
        this.tasks.delete(id);
      }
    });
  }

  async parseEventFile(filePath: string): Promise<ParsedEvent[]> {
    if (this.disposed) throw new Error('EventParserService has been shut down');
    await this.ready;
    const cached = await this.cache.get(filePath);
    if (cached) return cached;
    const events = await this.parseEventFileSync(filePath);
    await this.cache.set(filePath, events);
    return events;
  }

  async parseEventDirectory(dirPath: string): Promise<ParsedEvent[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tasks: Array<Promise<ParsedEvent[]>> = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        tasks.push(this.parseEventDirectory(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.txt')) {
        tasks.push(this.parseEventFile(fullPath));
      }
    }

    const results = await Promise.all(tasks);
    return results.flat();
  }

  async parseEventFileAsync(filePath: string): Promise<ParsedEvent[]> {
    if (this.disposed) throw new Error('EventParserService has been shut down');
    await this.ready;
    if (!this.enableAsync || this.workers.length === 0) {
      return this.parseEventFile(filePath);
    }

    const cached = await this.cache.get(filePath);
    if (cached) return cached;

    const content = await readParadoxFile(filePath);
    const id = randomUUID();
    const worker = this.idleWorkers.pop();
    if (!worker) {
      // Fallback to sync if pool exhausted
      return this.parseEventFile(filePath);
    }

    const result = await new Promise<ParsedEvent[]>((resolve, reject) => {
      this.tasks.set(id, { resolve, reject, worker });
      worker.postMessage({ id, content });
    });

    await this.cache.set(filePath, result);
    return result;
  }

  private parseEventFileSync(contentPath: string): Promise<ParsedEvent[]> {
    return (async () => {
      const content = await readParadoxFile(contentPath);
      const tokens = this.tokenizer.tokenize(content);
      const ast = this.parser.parse(tokens);
      return this.extractor.extract(ast);
    })();
  }

  async *parseEventFileStreaming(filePath: string): AsyncGenerator<ParsedEvent> {
    // Experimental streaming path; currently unused by routes but covered by tests for regressions.
    await this.ready;
    const stats = await fs.stat(filePath).catch(() => null as any);
    if (!stats || stats.size < 500_000) {
      const events = await this.parseEventFileAsync(filePath);
      for (const evt of events) yield evt;
      return;
    }

    const collected: ParsedEvent[] = [];
    for await (const tokens of this.tokenizer.tokenizeStream(readParadoxFileChunked(filePath))) {
      const ast = this.parser.parse(tokens);
      const events = this.extractor.extract(ast);
      collected.push(...events);
      for (const evt of events) yield evt;
    }
    if (collected.length > 0) {
      await this.cache.set(filePath, collected);
    }
  }

  cacheStats() {
    return this.cache.stats();
  }

  async clearCache() {
    await this.cache.clear();
  }

  async shutdown() {
    if (this.disposed) return;
    this.disposed = true;
    const termination = this.workers.map(w => w.terminate().catch(() => 0));
    this.workers = [];
    this.idleWorkers = [];
    const shutdownError = new Error('EventParserService is shutting down');
    this.tasks.forEach(task => task.reject(shutdownError));
    this.tasks.clear();
    await Promise.allSettled(termination);
  }
}
