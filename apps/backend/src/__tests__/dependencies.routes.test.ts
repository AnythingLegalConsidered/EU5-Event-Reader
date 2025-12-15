import express from 'express';
import path from 'path';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createDependenciesRouter } from '../routes/dependencies.routes';
import { errorHandler } from '../middleware/error-handler';

const fixturesDir = path.join(__dirname, 'fixtures');

let app: express.Express;

beforeAll(async () => {
  process.env.VANILLA_EVENTS_PATH = fixturesDir;
  process.env.LOCAL_EVENTS_PATH = fixturesDir;
  process.env.DEFAULT_SOURCE = 'vanilla';

  vi.resetModules();
  const { DependencyAnalyzerService, EventParserService, GameDataService } = await import('../services');
  const { LocalizationService } = await import('../services/localization.service');
  const { localizationConfig } = await import('../config/localization');

  const localizationService = new LocalizationService(localizationConfig);
  await localizationService.loadLocalizationDirectory(path.join(fixturesDir, 'localization'));

  const gameDataService = new GameDataService(new EventParserService(), localizationService);
  const dependencyAnalyzer = new DependencyAnalyzerService(gameDataService);

  app = express();
  app.use(express.json());
  app.use('/api', createDependenciesRouter(dependencyAnalyzer));
  app.use(errorHandler);
});

describe('Dependencies API routes', () => {
  it('returns dependency graphs for a country', async () => {
    const res = await request(app).get('/api/dependencies/ENG');
    expect(res.status).toBe(200);
    expect(res.body.dependencies.length).toBeGreaterThanOrEqual(2);

    const engGraph = res.body.dependencies.find((graph: any) => graph.eventId === 'flavor_eng.10');
    expect(engGraph).toBeDefined();
    expect(engGraph.dependencies.some((dep: any) => dep.type === 'flag')).toBe(true);
    expect(engGraph.dependencies.some((dep: any) => dep.type === 'event_reference')).toBe(true);
  });

  it('returns dependency graph for a single event id', async () => {
    const res = await request(app).get('/api/dependencies/event/flavor_eng.10');
    expect(res.status).toBe(200);
    expect(res.body.graph.eventId).toBe('flavor_eng.10');
    expect(res.body.graph.dependencies.length).toBeGreaterThan(0);
  });

  it('returns dependency graph for a single event id via canonical route', async () => {
    const res = await request(app).get('/api/dependencies/flavor_eng.10');
    expect(res.status).toBe(200);
    expect(res.body.graph.eventId).toBe('flavor_eng.10');
  });

  it('validates event id format on single graph route', async () => {
    const res = await request(app).get('/api/dependencies/event/invalid');
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing events', async () => {
    const res = await request(app).get('/api/dependencies/event/flavor_eng.999');
    expect(res.status).toBe(404);
  });
});
