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

import s3Routes from './routes/s3';
import penaltiesRoutes from './modules/penalties/penalties_routes';
import userRoutes from './modules/users/user_Routes';
import supervisorRoutes from './modules/supervisor/supervisor_routes';

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

const PORT = 3033;
connectDatabase();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req: Request, res: Response) => {
  logger.info('Health check requested');

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/attendance', attendanceRoutes);
app.use('/s3', s3Routes);
app.use('/workers', workersRoutes);

app.use('/api/vehicle', vechicleRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/supervisor', supervisorRoutes);
console.log('User routes registered at /api/users');
console.log('Supervisor routes registered at /api/supervisor');

app.use('/tasks', taskRoutes);
app.use('/salary', salaryRoute);
app.use('/api/incentives', incentiveRoutes);
// Register penalties correctly in the flow
app.use('/penalties', penaltiesRoutes);
console.log('Penalties route registered at /penalties (NORMAL FLOW)');

app.use('/analytics', analyticRoutes);
app.use('/api/reviews', reviewRoutes);

// Catch-all for unmatched routes to debug 404s
app.use((req, res, _next) => {
  console.log(`[404 NOT MATCHED] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(globalErrorHandler);
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port 3033 - LATEST UPDATE');
});

app.get('/test', (req, res) => {
  res.json({ message: 'Backend reachable' });
});
