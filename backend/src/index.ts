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
import salaryRoute from '../src/modules/salary/salary_routes';
import taskRoutes from '../src/modules/tasks/tasks_routes';
import workersRoutes from '../src/modules/Worker/workers_routes';
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
import redis from './config/redis';

const app = express();

app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8081',
      'http://10.10.2.230:8081',
      'http://10.10.1.203:8081',
      'http://10.10.3.21:8081',
      'http://10.10.3.182.1:8081',
      'http://10.10.2.19.1:8081',
      'http://10.10.1.164:8081',
    ],
    credentials: true,
  })
);

// Register maintenance middleware early
app.use(maintenanceMiddleware);

const PORT = 3033;
connectDatabase();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', async (_req: Request, res: Response) => {
  logger.info('Health check requested');

  const dbConnected = isDatabaseConnected();
  const redisStatus = redis.status;

  const healthData = {
    status: dbConnected && redisStatus === 'ready' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: { status: dbConnected ? 'connected' : 'disconnected' },
      redis: { status: redisStatus },
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

// Routes
app.use('/api/auth', authRouter);
app.use('/api', attendanceRoutes);
app.use('/s3', s3Routes);
app.use('/workers', workersRoutes);
app.use('/api/vehicle', vechicleRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/supervisor', supervisorRoute);

app.use('/tasks', taskRoutes);
app.use('/api/salary', salaryRoute);
app.use('/api/incentives', incentiveRoutes);
app.use('/penalties', penaltiesRoutes);
app.use('/analytics', analyticRoutes);
app.use('/feedback', reviewRoutes);
app.use('/supervisors', supervisorRoute);
app.use('/api/floors', floorRoute);
app.use('/fraud', fraudRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api', Adminaccountantrouter);

// Catch-all for unmatched routes
app.use((req, res, _next) => {
  console.log(`[404 NOT MATCHED] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(globalErrorHandler);
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port 3033');
});
