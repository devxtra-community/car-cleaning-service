import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

import express, { Request, Response } from 'express';
import { logger } from './config/logger';
import { connectDatabase } from './database/connectDatabase';
import { globalErrorHandler } from './middlewares/error-handler';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRouter from './modules/auth/auth_routes';
import vechicleRoutes from './modules/vehicles/vechicleRoutes';
import attendanceRoutes from './modules/attendance/attendance_routes';
import salaryRoute from '../src/modules/salary/salary_routes';
import taskRoutes from '../src/modules/tasks/tasks_routes';
import workersRoutes from '../src/modules/Worker/workers_routes';
import buildingsRoutes from './modules/buildings/buildings_routes';
import incentiveRoutes from './modules/incentives/incentives_routes';
import analyticRoutes from './modules/analytics/analytic_routes';
import reviewRoutes from './modules/feedback/review_routes';
import supervisorRoute from './modules/supervisor/supervisor_routes';
import floorRoute from './modules/floors/floorRoutes';
import s3Routes from './routes/s3';
import penaltiesRoutes from './modules/penalties/penalties_routes';
import fraudRoutes from './modules/fraud/fraud_routes';
import notificationRoutes from './modules/notifications/notification_routes';
import systemRoutes from './modules/system/system_routes';
import { maintenanceMiddleware } from './middlewares/maintenance';
import redis from './config/redis';
import { isDatabaseConnected } from './database/connectDatabase';
import os from 'os';

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true, // Reflects the request origin, required for credentials: true
    credentials: true,
  })
);

// Register maintenance middleware early
app.use(maintenanceMiddleware);

const PORT = 3033;
connectDatabase();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', async (req: Request, res: Response) => {
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
      }
    }
  };

  res.status(healthData.status === 'ok' ? 200 : 503).json(healthData);
});

app.use('/api/auth', authRouter);
app.use('/attendance', attendanceRoutes);
app.use('/s3', s3Routes);
app.use('/workers', workersRoutes);

app.use('/api/vehicle', vechicleRoutes);
app.use('/api/buildings', buildingsRoutes);

app.use('/tasks', taskRoutes);
app.use('/salary', salaryRoute);
app.use('/api/incentives', incentiveRoutes);
// Register penalties correctly in the flow
app.use('/penalties', penaltiesRoutes);
console.log('Penalties route registered at /penalties (NORMAL FLOW)');

app.use('/analytics', analyticRoutes);
app.use('/feedback', reviewRoutes);
app.use('/supervisors', supervisorRoute);
app.use('/api/floors', floorRoute);
app.use('/fraud', fraudRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/system', systemRoutes);

app.use(globalErrorHandler);
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port 3033 - LATEST UPDATE');
});

app.get('/test', (req, res) => {
  res.json({ message: 'Backend reachable' });
});

// restart
