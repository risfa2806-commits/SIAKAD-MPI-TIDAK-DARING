import type { Request, Response } from 'express';
import app from '../server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '150mb',
    },
  },
};

export default function handler(req: Request, res: Response) {
  // 1. If Vercel consumed or pre-parsed the body, normalize it into an Object so Express body-parser doesn't hang
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    } else if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf-8'));
      } catch {}
    }
    (req as any)._body = true;
  }

  // 2. Normalize req.url so Express routes matching /api/* always match accurately on Vercel
  let targetPath = '';
  if (req.query && req.query.all) {
    const allVal = req.query.all;
    const segments = Array.isArray(allVal) ? allVal.join('/') : String(allVal);
    targetPath = '/api/' + segments.replace(/^\/+/, '');
  } else if (
    req.headers &&
    req.headers['x-matched-path'] &&
    typeof req.headers['x-matched-path'] === 'string' &&
    req.headers['x-matched-path'].startsWith('/api') &&
    req.headers['x-matched-path'] !== '/api/index'
  ) {
    targetPath = req.headers['x-matched-path'];
  } else if (
    req.headers &&
    req.headers['x-forwarded-uri'] &&
    typeof req.headers['x-forwarded-uri'] === 'string' &&
    req.headers['x-forwarded-uri'].startsWith('/api') &&
    req.headers['x-forwarded-uri'] !== '/api/index'
  ) {
    targetPath = req.headers['x-forwarded-uri'];
  } else if (req.url) {
    targetPath = req.url;
  }

  // Fallback if targetPath is /api/index or /api
  if (targetPath === '/api/index' || targetPath === '/api') {
    if (req.headers && typeof req.headers['x-matched-path'] === 'string' && req.headers['x-matched-path'] !== '/api/index') {
      targetPath = req.headers['x-matched-path'];
    } else if (req.headers && typeof req.headers['x-forwarded-uri'] === 'string' && req.headers['x-forwarded-uri'] !== '/api/index') {
      targetPath = req.headers['x-forwarded-uri'];
    }
  }

  const [pathname, search] = (targetPath || req.url || '').split('?');
  let cleanPath = pathname;

  if (cleanPath.includes('[...all]')) {
    if (req.query && req.query.all) {
      const segs = Array.isArray(req.query.all) ? req.query.all.join('/') : String(req.query.all);
      cleanPath = cleanPath
        .replace('/api/[...all]', '/api/' + segs.replace(/^\/+/, ''))
        .replace('/[...all]', '/api/' + segs.replace(/^\/+/, ''))
        .replace('[...all]', segs.replace(/^\/+/, ''));
    }
  }

  if (
    !cleanPath.startsWith('/api') &&
    cleanPath !== '/' &&
    !cleanPath.startsWith('/assets') &&
    !cleanPath.startsWith('/vite') &&
    !cleanPath.startsWith('/src') &&
    !cleanPath.startsWith('/@') &&
    !cleanPath.startsWith('/node_modules') &&
    !cleanPath.includes('.')
  ) {
    cleanPath = '/api' + (cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath);
  }

  req.url = search ? `${cleanPath}?${search}` : cleanPath;

  return app(req, res);
}

