import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase } from './src/server/db.ts';
import { initSocketIO } from './src/server/socket.ts';

import authRoutes from './src/server/routes/auth.ts';
import facilitiesRoutes from './src/server/routes/facilities.ts';
import slotsRoutes from './src/server/routes/slots.ts';
import bookingsRoutes from './src/server/routes/bookings.ts';
import aiRoutes from './src/server/routes/ai.ts';
import analyticsRoutes from './src/server/routes/analytics.ts';
import adminRoutes from './src/server/routes/admin.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = Number(process.env.PORT) || 3000;
  // Do not serve public sessions from the sample secrets in the original project.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'parkingspot_super_secret_jwt_key_2026') {
      throw new Error('Set a unique JWT_SECRET in your backend environment.');
    }
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error('Set ADMIN_PASSWORD in your backend environment before deploying.');
    }
  }

  // Initialize Socket.IO
  initSocketIO(httpServer);

  // Connect Database (MongoDB Atlas / in-memory fallback)
  await connectDatabase();

  // Allow browser requests from the deployed Vercel frontend.
  const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin not allowed: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/facilities', facilitiesRoutes);
  app.use('/api/slots', slotsRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check route
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ParkingSpot',
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware in dev or static serving in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(port, () => {
    console.log(`[ParkingSpot Server] Running on http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error('[Server Fatal Error]', err);
  process.exit(1);
});
