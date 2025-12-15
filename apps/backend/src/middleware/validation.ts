import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { SUPPORTED_LANGUAGES } from '../config/localization';

const languageSchema = z.preprocess(
  value => (typeof value === 'string' ? value.toLowerCase() : value),
  z.enum(SUPPORTED_LANGUAGES)
);

const sourceSchema = z.preprocess(
  value => (typeof value === 'string' ? value.toLowerCase() : value),
  z.enum(['vanilla', 'local'])
);

export const countryParamSchema = z.object({
  country: z
    .string()
    .trim()
    .regex(/^[a-z]{3}$/i, { message: 'country must be a 3-letter tag' })
    .transform(value => value.toUpperCase())
});

export const eventQuerySchema = z.object({
  language: languageSchema.optional(),
  source: sourceSchema.optional()
});

export const paginationQuerySchema = eventQuerySchema.extend({
  page: z.coerce
    .number({ invalid_type_error: 'page must be a number' })
    .int()
    .min(1, { message: 'page must be at least 1' })
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'limit must be a number' })
    .int()
    .min(1, { message: 'limit must be at least 1' })
    .max(200, { message: 'limit must be at most 200' })
    .default(50)
});

export const eventIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+\.\d+$/i, { message: 'id must follow namespace.numericId format' })
});

export const validateQuery = <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
        timestamp: new Date().toISOString()
      });
    }
    (req as any).validatedQuery = result.data;
    return next();
  };

export const validateParams = <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
        timestamp: new Date().toISOString()
      });
    }
    (req as any).validatedParams = result.data;
    return next();
  };

export const eventsQueryWithCountry = eventQuerySchema;
export const eventIdQuery = eventQuerySchema;
