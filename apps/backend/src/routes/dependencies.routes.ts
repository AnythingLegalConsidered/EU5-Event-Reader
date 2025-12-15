import { Router } from 'express';
import { gameDataConfig } from '../config/game-data';
import { DependencyAnalyzerService } from '../services';
import {
  countryParamSchema,
  eventIdParamSchema,
  eventQuerySchema,
  validateParams,
  validateQuery
} from '../middleware/validation';

export const createDependenciesRouter = (dependencyAnalyzer: DependencyAnalyzerService) => {
  const router = Router();

  router.get(
    '/dependencies/:country([A-Za-z]{3})',
    validateParams(countryParamSchema),
    validateQuery(eventQuerySchema),
    async (req, res, next) => {
      try {
        const { country } = (req as any).validatedParams;
        const { source } = (req as any).validatedQuery ?? {};
        const resolvedSource = source ?? gameDataConfig.defaultSource;
        const dependencies = await dependencyAnalyzer.getDependenciesByCountry(country, resolvedSource);

        res.json({ country, source: resolvedSource, dependencies });
      } catch (error) {
        next(error);
      }
    }
  );

  const eventHandler = async (req: any, res: any, next: any) => {
    try {
      const { id } = req.validatedParams;
      const { source } = req.validatedQuery ?? {};
      const resolvedSource = source ?? gameDataConfig.defaultSource;
      const graph = await dependencyAnalyzer.getDependenciesForEvent(id, resolvedSource);

      if (!graph) {
        return res.status(404).json({
          error: 'Event not found',
          id,
          source: resolvedSource
        });
      }

      res.json({ id, source: resolvedSource, graph });
    } catch (error) {
      next(error);
    }
  };

  router.get(
    '/dependencies/:id',
    validateParams(eventIdParamSchema),
    validateQuery(eventQuerySchema),
    eventHandler
  );

  router.get(
    '/dependencies/event/:id',
    validateParams(eventIdParamSchema),
    validateQuery(eventQuerySchema),
    eventHandler
  );

  return router;
};
