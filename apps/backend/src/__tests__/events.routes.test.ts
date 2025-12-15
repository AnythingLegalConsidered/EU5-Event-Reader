import express from 'express';
import path from 'path';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createEventsRouter } from '../routes/events.routes';
import { errorHandler } from '../middleware/error-handler';

const fixturesDir = path.join(__dirname, 'fixtures');

let app: express.Express;

beforeAll(async () => {
  process.env.VANILLA_EVENTS_PATH = fixturesDir;
  process.env.LOCAL_EVENTS_PATH = fixturesDir;
  process.env.DEFAULT_SOURCE = 'vanilla';

  vi.resetModules();
  const { EventParserService, GameDataService } = await import('../services');
  const { LocalizationService } = await import('../services/localization.service');
  const { localizationConfig } = await import('../config/localization');

  const localizationService = new LocalizationService(localizationConfig);
  await localizationService.loadLocalizationDirectory(path.join(fixturesDir, 'localization'));

  const gameDataService = new GameDataService(new EventParserService(), localizationService);

  app = express();
  app.use(express.json());
  app.use('/api', createEventsRouter(gameDataService, localizationService));
  app.use(errorHandler);
});

describe('Events API routes', () => {
  it('lists countries', async () => {
    const res = await request(app).get('/api/countries');
    expect(res.status).toBe(200);
    expect(res.body.countries.length).toBeGreaterThanOrEqual(2);
    expect(res.body.countries[0]).toHaveProperty('tag');
  });

  it('returns localized events for a country', async () => {
    const res = await request(app).get('/api/events/FRA').query({ language: 'french' });
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(2);
    expect(res.body.events[0].localizedTitle).toBeDefined();
  });

  it('paginates events for a country', async () => {
    const res = await request(app).get('/api/events/FRA').query({ language: 'french', page: 1, limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.pagination.total).toBeGreaterThan(1);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(1);
    expect(res.body.pagination.hasNext).toBe(true);
  });

  it('returns count only endpoint', async () => {
    const res = await request(app).get('/api/events/FRA/count');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('rejects invalid pagination', async () => {
    const res = await request(app).get('/api/events/FRA').query({ page: 0, limit: 500 });
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric page', async () => {
    const res = await request(app).get('/api/events/FRA').query({ page: 'abc', limit: 1 });
    expect(res.status).toBe(400);
    expect(res.body.details?.fieldErrors?.page?.[0]).toMatch(/number/i);
  });

  it('rejects non-numeric limit', async () => {
    const res = await request(app).get('/api/events/FRA').query({ page: 1, limit: 'foo' });
    expect(res.status).toBe(400);
    expect(res.body.details?.fieldErrors?.limit?.[0]).toMatch(/number/i);
  });

  it('returns a single event by id', async () => {
    const res = await request(app).get('/api/event/flavor_eng.10');
    expect(res.status).toBe(200);
    expect(res.body.event.id).toBe(10);
  });

  it('validates event id format', async () => {
    const res = await request(app).get('/api/event/invalid');
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing events', async () => {
    const res = await request(app).get('/api/event/flavor_eng.999');
    expect(res.status).toBe(404);
  });
});
