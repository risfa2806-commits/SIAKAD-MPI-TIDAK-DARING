import type { Request, Response } from 'express';
import app from '../server';

export default function handler(req: Request, res: Response) {
  // Normalize req.url so Express routes matching /api/* always match
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
