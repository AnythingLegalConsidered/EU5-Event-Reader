import fs from 'fs/promises';
import path from 'path';

export type CacheEntry<T> = {
  value: T;
  createdAt: number;
  expiresAt: number | null;
  hits: number;
  size: number;
};

export type CacheStats = {
  entries: number;
  totalSizeBytes: number;
  hitRate: number;
};

export class CacheService<T> {
  private memory = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;
  private cacheDir: string;
  private defaultTtlMs: number | null;
  private maxSizeBytes: number;

  constructor(options?: { cacheDir?: string; defaultTtlSeconds?: number | null; maxSizeMb?: number }) {
    this.cacheDir = path.resolve(process.cwd(), options?.cacheDir ?? process.env.CACHE_DIR ?? '.cache');
    const ttlSecondsEnv = process.env.CACHE_TTL_SECONDS ? Number(process.env.CACHE_TTL_SECONDS) : undefined;
    const maxSizeEnv = process.env.CACHE_MAX_SIZE_MB ? Number(process.env.CACHE_MAX_SIZE_MB) : undefined;
    this.defaultTtlMs = options?.defaultTtlSeconds === null
      ? null
      : ((options?.defaultTtlSeconds ?? ttlSecondsEnv) ?? 3600) * 1000;
    this.maxSizeBytes = (options?.maxSizeMb ?? maxSizeEnv ?? 100) * 1024 * 1024;
  }

  async init(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    await this.prune();
  }

  private buildFilePath(key: string): string {
    const safe = key.replace(/[^a-zA-Z0-9-_:.]/g, '_');
    return path.join(this.cacheDir, `${safe}.json`);
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  private async readFromDisk(key: string): Promise<CacheEntry<T> | null> {
    const filePath = this.buildFilePath(key);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (this.isExpired(parsed)) {
        await fs.unlink(filePath).catch(() => {});
        return null;
      }
      return parsed;
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      return null;
    }
  }

  private async writeToDisk(key: string, entry: CacheEntry<T>): Promise<void> {
    const filePath = this.buildFilePath(key);
    const data = JSON.stringify(entry);
    await fs.writeFile(filePath, data, 'utf-8');
  }

  private currentSize(): number {
    let size = 0;
    this.memory.forEach(entry => {
      size += entry.size;
    });
    return size;
  }

  private async enforceLru(): Promise<void> {
    let size = this.currentSize();
    if (size <= this.maxSizeBytes) return;
    const entries = Array.from(this.memory.entries());
    entries.sort((a, b) => a[1].hits - b[1].hits || a[1].createdAt - b[1].createdAt);
    for (const [key] of entries) {
      const entry = this.memory.get(key);
      if (!entry) continue;
      await this.delete(key);
      size -= entry.size;
      if (size <= this.maxSizeBytes) break;
    }
  }

  async get(key: string): Promise<T | null> {
    const inMemory = this.memory.get(key);
    if (inMemory) {
      if (this.isExpired(inMemory)) {
        await this.delete(key);
        this.misses += 1;
        return null;
      }
      inMemory.hits += 1;
      this.hits += 1;
      return inMemory.value;
    }

    const fromDisk = await this.readFromDisk(key);
    if (!fromDisk) {
      this.misses += 1;
      return null;
    }
    if (this.isExpired(fromDisk)) {
      await this.delete(key);
      this.misses += 1;
      return null;
    }
    fromDisk.hits += 1;
    this.memory.set(key, fromDisk);
    this.hits += 1;
    return fromDisk.value;
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async set(key: string, value: T, ttlSeconds?: number | null): Promise<void> {
    let ttlMs: number | null;
    if (ttlSeconds === null) {
      ttlMs = null;
    } else if (typeof ttlSeconds === 'number') {
      ttlMs = ttlSeconds * 1000;
    } else {
      ttlMs = this.defaultTtlMs;
    }
    const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;
    const serialized = JSON.stringify(value);
    const size = Buffer.byteLength(serialized, 'utf-8');
    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      expiresAt,
      hits: 0,
      size
    };
    this.memory.set(key, entry);
    await this.writeToDisk(key, entry);
    await this.enforceLru();
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    const filePath = this.buildFilePath(key);
    await fs.unlink(filePath).catch(() => {});
  }

  async clear(): Promise<void> {
    this.memory.clear();
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)).catch(() => {}))
      );
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async prune(): Promise<void> {
    const files = await fs.readdir(this.cacheDir).catch(() => [] as string[]);
    for (const file of files) {
      const full = path.join(this.cacheDir, file);
      try {
        const raw = await fs.readFile(full, 'utf-8');
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (this.isExpired(parsed)) {
          await fs.unlink(full).catch(() => {});
        } else {
          this.memory.set(path.basename(file, '.json'), parsed);
        }
      } catch {
        await fs.unlink(full).catch(() => {});
      }
    }
    await this.enforceLru();
  }

  stats(): CacheStats {
    const entries = this.memory.size;
    const totalSizeBytes = this.currentSize();
    const total = this.hits + this.misses;
    const hitRate = total === 0 ? 0 : this.hits / total;
    return { entries, totalSizeBytes, hitRate };
  }
}
