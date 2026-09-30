import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { seedDemoData } from './server/database/seed.js';
import { extractUserMiddleware } from './server/middleware/auth.js';
import { basicRateLimit } from './server/middleware/rateLimit.js';

// Route handlers
import authRoutes from './server/routes/authRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import aiRoutes from './server/routes/aiRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import mapRoutes from './server/routes/mapRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB & Seed Demo Data
  try {
    await seedDemoData();
  } catch (err) {
    console.error('Failed to initialize or seed database:', err);
  }

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(basicRateLimit(240, 60 * 1000));
  app.use(extractUserMiddleware);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'RoadSafe India API',
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/map', mapRoutes);

  // Fallback safe error handler for API
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    res.status(err.status || 500).json({
      error: 'An unexpected server error occurred. Please try again.',
    });
  });

  // Serve Frontend via Vite dev middleware or built dist
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` RoadSafe India Server running on http://0.0.0.0:${PORT}`);
    console.log(` Tagline: "Report. Analyze. Prioritize. Make Roads Safer."`);
    console.log(`=======================================================`);
  });
}

startServer();
