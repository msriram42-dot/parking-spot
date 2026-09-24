import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.ts';
import facilitiesRoutes from './routes/facilities.ts';
import slotsRoutes from './routes/slots.ts';
import bookingsRoutes from './routes/bookings.ts';
import aiRoutes from './routes/ai.ts';
import analyticsRoutes from './routes/analytics.ts';
import adminRoutes from './routes/admin.ts';

export const app = express();

// Calls from the Vercel frontend are same-origin. A separately hosted frontend
// can also use the API when its origin is listed in FRONTEND_URL.
app.use((req, res, next) => {
  const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
  cors({
    origin: (origin, callback) => {
      let sameOrigin = false;
      try {
        sameOrigin = !!origin && new URL(origin).host === req.get('host');
      } catch {
        // Invalid origins are not allowed in production.
      }
      if (!origin || sameOrigin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })(req, res, next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ParkingSpot', timestamp: new Date().toISOString() });
});

// Never serve the SPA HTML to an API client.
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ParkingSpot API]', err);
  res.status(500).json({ error: 'Parking service error' });
});
