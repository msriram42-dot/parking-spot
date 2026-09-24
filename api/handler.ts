import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../src/server/app.ts';

// The explicit path query preserves the original route after Vercel rewrites
// /api/* to this function.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'https://localhost');
  const route = url.searchParams.get('apiPath');
  if (route !== null) {
    url.searchParams.delete('apiPath');
    req.url = `/api/${route.replace(/^\/+/, '')}${url.search}`;
  }

  const apiPath = new URL(req.url || '/', 'https://localhost').pathname;
  const isPublicRead = req.method === 'GET' && (
    apiPath === '/api/health' ||
    /^\/api\/facilities(?:\/(?:autocomplete|[A-Za-z0-9_-]+(?:\/slots)?))?$/.test(apiPath)
  );
  const hasSecureAuth = !!process.env.JWT_SECRET &&
    process.env.JWT_SECRET !== 'parkingspot_super_secret_jwt_key_2026' &&
    !!process.env.ADMIN_PASSWORD;

  // Keep seed credentials and the sample JWT secret out of public sessions.
  if (process.env.NODE_ENV === 'production' && !hasSecureAuth && !isPublicRead) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Authentication is not configured on the server.' }));
    return;
  }

  app(req, res);
}
