import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

import express, { Request, Response } from 'express';
import { logger } from './config/logger';
import { connectDatabase, isDatabaseConnected } from './database/connectDatabase';
import { globalErrorHandler } from './middlewares/error-handler';
import cookieParser from 'cookie-parser';
import path from 'path';
import os from 'os';
import authRouter from './modules/auth/auth_routes';
import vechicleRoutes from './modules/vehicles/vechicleRoutes';
import attendanceRoutes from './modules/attendance/attendance_routes';
import { authMiddleware } from './middlewares/authMiddleware';
import salaryRoutes from './modules/salary/salary_routes';
import taskRoutes from './modules/tasks/tasks_routes';
import workersRoutes from './modules/Worker/workers_routes';
import buildingsRoutes from './modules/buildings/buildings_routes';
import incentiveRoutes from './modules/incentives/incentives_routes';
import analyticRoutes from './modules/analytics/analytic_routes';
import supervisorRoute from './modules/supervisor/supervisor_routes';
import Adminaccountantrouter from './modules/AdminAccountant/Adminaccountantrouter';
import s3Routes from './routes/s3';
import reviewRoutes from './modules/feedback/review_routes';
import floorRoute from './modules/floors/floorRoutes';
import penaltiesRoutes from './modules/penalties/penalties_routes';
import userRoutes from './modules/users/user_Routes';
import fraudRoutes from './modules/fraud/fraud_routes';
import notificationRoutes from './modules/notifications/notification_routes';
import systemRoutes from './modules/system/system_routes';
import { maintenanceMiddleware } from './middlewares/maintenance';

const app = express();

app.use(express.json());
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`, { method: req.method, url: req.url });
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // In production, you might want to restrict this to your actual domain
      // For now, allowing all while we transition to a reverse proxy setup
      callback(null, true);
    },
    credentials: true,
  })
);

// Register maintenance middleware early
app.use(maintenanceMiddleware);

const PORT = Number(process.env.PORT) || 3033;
connectDatabase();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', async (_req: Request, res: Response) => {
  logger.info('Health check requested');

  const dbConnected = isDatabaseConnected();

  const healthData = {
    status: dbConnected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: { status: dbConnected ? 'connected' : 'disconnected' },
    },
    resources: {
      memory: {
        total: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        free: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%',
      },
      cpu: {
        load: os.loadavg()[0].toFixed(2),
      },
    },
  };

  res.status(healthData.status === 'ok' ? 200 : 503).json(healthData);
});

app.get('/test', (_req, res) => {
  res.json({ message: 'Backend reachable' });
});

app.get('/api/debug-test', (_req, res) => {
  res.json({ message: 'API Proxy working perfectly' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: More specific routes must come BEFORE generic catch-all mounts
app.use('/api/analytics', analyticRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api/auth', authRouter);
app.use('/api/vehicle', vechicleRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/supervisor', supervisorRoute);
app.use('/api/salary', salaryRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/floors', floorRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api', Adminaccountantrouter);
app.use('/api', attendanceRoutes);
app.use('/s3', s3Routes);
app.use('/workers', workersRoutes);
app.use('/tasks', taskRoutes);
app.use('/penalties', penaltiesRoutes);
app.use('/feedback', reviewRoutes);
app.use('/fraud', fraudRoutes);

// Catch-all for unmatched routes
app.use((req, res, _next) => {
  logger.warn(`404 not found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
  });
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(globalErrorHandler);
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Backend running on port ${PORT}`);
});
