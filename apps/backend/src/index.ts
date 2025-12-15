import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { DependencyAnalyzerService, EventParserService, GameDataService } from './services';
import { LocalizationService } from './services/localization.service';
import { createLocalizationRouter } from './routes/localization.routes';
import { createEventsRouter } from './routes/events.routes';
import { createDependenciesRouter } from './routes/dependencies.routes';
import { localizationConfig } from './config/localization';
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const eventParser = new EventParserService();
const localizationService = new LocalizationService(localizationConfig);
const gameDataService = new GameDataService(eventParser, localizationService);
const dependencyAnalyzer = new DependencyAnalyzerService(gameDataService);

app.use(cors());
app.use(express.json());
app.use(compression({ level: 6, threshold: 1024 }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: {
      eventParser: eventParser.cacheStats(),
      gameData: gameDataService.cacheStats(),
      dependencies: dependencyAnalyzer.cacheStats()
    }
  });
});

app.get('/api/cache/stats', (_req, res) => {
  res.json({
    eventParser: eventParser.cacheStats(),
    gameData: gameDataService.cacheStats(),
    dependencies: dependencyAnalyzer.cacheStats()
  });
});

app.post('/api/cache/clear', async (req, res) => {
  const target = (req.body as any)?.service as string | undefined;
  if (!target || target === 'all') {
    await Promise.all([
      eventParser.clearCache(),
      gameDataService.clearCache(),
      dependencyAnalyzer.clearCache()
    ]);
    return res.json({ cleared: 'all' });
  }

  switch (target) {
    case 'events':
      await eventParser.clearCache();
      break;
    case 'gameData':
      await gameDataService.clearCache();
      break;
    case 'dependencies':
      await dependencyAnalyzer.clearCache();
      break;
    default:
      return res.status(400).json({ error: 'Unknown service', target });
  }
  return res.json({ cleared: target });
});

app.use('/api/localization', createLocalizationRouter(localizationService, localizationConfig));
app.use('/api', createEventsRouter(gameDataService, localizationService));
app.use('/api', createDependenciesRouter(dependencyAnalyzer));

app.get('/api/parse-test', async (_req, res) => {
  try {
    const fixturePath = path.join(__dirname, '__tests__', 'fixtures', 'simple-event.txt');
    const events = await eventParser.parseEventFile(fixturePath);
    res.json({ status: 'ok', count: events.length, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Parse test failed' });
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

const shutdown = async () => {
  await eventParser.shutdown().catch(err => console.error('Failed to shutdown parser', err));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const localizationPath = process.env.LOCALIZATION_PATH;
if (localizationPath) {
  localizationService
    .loadLocalizationDirectory(localizationPath)
    .then(loaded => console.log(`Loaded ${loaded} localization entries from ${localizationPath}`))
    .catch(err => console.error('Failed to load localization on startup', err));
}
