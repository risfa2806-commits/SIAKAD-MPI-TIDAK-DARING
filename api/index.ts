import type { Request, Response } from 'express';
import app from '../server';

export default function handler(req: Request, res: Response) {
  const forwardedUri = (req.headers['x-forwarded-uri'] as string) ||
                       (req.headers['x-matched-path'] as string) ||
                       (req.headers['x-now-route-matches'] as string);
  if (forwardedUri && forwardedUri.startsWith('/api')) {
    req.url = forwardedUri;
  } else if (req.query && typeof req.query.path === 'string') {
    const queryPath = req.query.path.startsWith('/') ? req.query.path : `/${req.query.path}`;
    req.url = `/api${queryPath}`;
  }
  return app(req, res);
}
