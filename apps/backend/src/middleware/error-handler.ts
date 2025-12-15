import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

type FsError = NodeJS.ErrnoException & { code: string };

const isFsError = (error: unknown): error is FsError =>
  !!error && typeof error === 'object' && 'code' in (error as any) && typeof (error as any).code === 'string';

const timestamp = () => new Date().toISOString();

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten(),
      timestamp: timestamp()
    });
  }

  if (isFsError(err) && ['ENOENT', 'EACCES', 'EPERM'].includes(err.code)) {
    return res.status(500).json({
      error: 'Failed to access event data',
      details: err.message,
      code: err.code,
      timestamp: timestamp()
    });
  }

  const status = (err as any)?.status && Number.isInteger((err as any).status) ? (err as any).status : 500;
  const message = (err as any)?.message ?? 'Internal Server Error';

  return res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : message,
    details: status === 500 ? undefined : message,
    timestamp: timestamp()
  });
};
