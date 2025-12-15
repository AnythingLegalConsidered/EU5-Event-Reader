import { Router } from 'express';
import { GameDataService } from '../services';
import { LocalizationService } from '../services/localization.service';
import { localizationConfig } from '../config/localization';
import { gameDataConfig } from '../config/game-data';
import {
  countryParamSchema,
  eventIdParamSchema,
  eventQuerySchema,
  paginationQuerySchema,
  validateParams,
  validateQuery
} from '../middleware/validation';

export const createEventsRouter = (
  gameDataService: GameDataService,
  localizationService: LocalizationService
) => {
  const router = Router();

  router.get(
    '/countries',
    validateQuery(eventQuerySchema),
    async (req, res, next) => {
      try {
        const { source } = (req as any).validatedQuery ?? {};
        const resolvedSource = source ?? gameDataConfig.defaultSource;
        const countries = await gameDataService.discoverCountries(resolvedSource);
        res.set('Cache-Control', 'public, max-age=3600');
        res.json({ source: resolvedSource, countries });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/events/:country',
    validateParams(countryParamSchema),
    validateQuery(paginationQuerySchema),
    async (req, res, next) => {
      try {
        const { country } = (req as any).validatedParams;
        const { language, source, page = 1, limit = 50 } = (req as any).validatedQuery ?? {};
        const resolvedSource = source ?? gameDataConfig.defaultSource;
        const resolvedLanguage = language ?? localizationConfig.defaultLanguage;
        const events = await gameDataService.getLocalizedEventsByCountry(country, {
          source: resolvedSource,
          language: resolvedLanguage,
          fallbackLanguage: localizationConfig.fallbackLanguage
        });
        res.set('Cache-Control', 'public, max-age=3600');
        const start = (page - 1) * limit;
        const end = start + limit;
        const paged = events.slice(start, end);
        const total = events.length;
        res.json({
          country,
          source: resolvedSource,
          language: resolvedLanguage,
          events: paged,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
            hasNext: end < total,
            hasPrev: start > 0
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/events/:country/count',
    validateParams(countryParamSchema),
    validateQuery(eventQuerySchema),
    async (req, res, next) => {
      try {
        const { country } = (req as any).validatedParams;
        const { source } = (req as any).validatedQuery ?? {};
        const resolvedSource = source ?? gameDataConfig.defaultSource;
        const events = await gameDataService.getEventsByCountry(country, resolvedSource);
        res.set('Cache-Control', 'public, max-age=3600');
        res.json({ country, source: resolvedSource, total: events.length });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/event/:id',
    validateParams(eventIdParamSchema),
    validateQuery(eventQuerySchema),
    async (req, res, next) => {
      try {
        const { id } = (req as any).validatedParams;
        const { language, source } = (req as any).validatedQuery ?? {};
        const resolvedSource = source ?? gameDataConfig.defaultSource;
        const resolvedLanguage = language ?? localizationConfig.defaultLanguage;
        const event = await gameDataService.getEventById(id, resolvedSource);
        if (!event) {
          return res.status(404).json({
            error: 'Event not found',
            id,
            source: resolvedSource
          });
        }
        const localized = localizationService.resolveEvent(event, {
          language: resolvedLanguage,
          fallbackLanguage: localizationConfig.fallbackLanguage,
          resolveVariables: true
        });
        res.json({
          id,
          source: resolvedSource,
          language: resolvedLanguage,
          event: localized
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
