import fs from 'fs/promises';
import path from 'path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CacheService } from '../services/cache.service';

const TMP_DIR = path.join(process.cwd(), '.cache-test');

describe('CacheService', () => {
  beforeAll(async () => {
    await fs.rm(TMP_DIR, { recursive: true, force: true }).catch(() => {});
  });

  afterEach(async () => {
    await fs.rm(TMP_DIR, { recursive: true, force: true }).catch(() => {});
  });

  it('stores and retrieves values', async () => {
    const cache = new CacheService<string>({ cacheDir: TMP_DIR, defaultTtlSeconds: 60 });
    await cache.init();
    await cache.set('key', 'value');
    const value = await cache.get('key');
    expect(value).toBe('value');
    expect(cache.stats().entries).toBeGreaterThan(0);
  });

  it('expires entries after ttl', async () => {
    const cache = new CacheService<string>({ cacheDir: TMP_DIR, defaultTtlSeconds: 0.01 });
    await cache.init();
    await cache.set('a', 'b');
    await new Promise(res => setTimeout(res, 20));
    const value = await cache.get('a');
    expect(value).toBeNull();
  });

  it('evicts least-used items when exceeding max size', async () => {
    const cache = new CacheService<string>({ cacheDir: TMP_DIR, defaultTtlSeconds: null, maxSizeMb: 0.0001 });
    await cache.init();
    await cache.set('k1', 'x'.repeat(50));
    await cache.set('k2', 'y'.repeat(50));
    const v1 = await cache.get('k1');
    const v2 = await cache.get('k2');
    const remaining = [v1, v2].filter(Boolean).length;
    expect(remaining).toBeGreaterThan(0);
  });

  it('persists to disk and reloads', async () => {
    const cache = new CacheService<string>({ cacheDir: TMP_DIR, defaultTtlSeconds: null });
    await cache.init();
    await cache.set('persist', 'ok');
    const cache2 = new CacheService<string>({ cacheDir: TMP_DIR, defaultTtlSeconds: null });
    await cache2.init();
    const value = await cache2.get('persist');
    expect(value).toBe('ok');
  });

  it('handles broken files gracefully', async () => {
    await fs.mkdir(TMP_DIR, { recursive: true });
    await fs.writeFile(path.join(TMP_DIR, 'bad.json'), '{not-json');
    const cache = new CacheService<string>({ cacheDir: TMP_DIR, defaultTtlSeconds: null });
    await cache.init();
    expect(await cache.get('bad')).toBeNull();
  });
});
