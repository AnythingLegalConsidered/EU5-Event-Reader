import { Router } from 'express';

export { createEventsRouter } from './events.routes';
export { createLocalizationRouter } from './localization.routes';
export { createDependenciesRouter } from './dependencies.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default router;
