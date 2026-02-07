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


import s3Routes from './routes/s3';
const app = express();

app.use(express.json());
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
app.use('/api', attendanceRoutes);
app.use('/s3', s3Routes);
app.use('/workers', workersRoutes);

app.use('/api/vehicle', vechicleRoutes);
app.use('/api/buildings', buildingsRoutes);

app.use('/tasks', taskRoutes);
app.use('/salary', salaryRoute);
app.use(globalErrorHandler);
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port 3033');
});

app.get('/test', (req, res) => {
  res.json({ message: 'Backend reachable' });
});
