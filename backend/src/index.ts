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
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://192.168.56.1:8081',
      'http://10.10.3.182.1:8081',
      'http://10.10.2.19.1:8081',
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
app.use('/api/vehicle', vechicleRoutes);
app.use('/salary', salaryRoute);

app.use(globalErrorHandler);
app.listen(PORT, () => {
  logger.info(`Server started on port http://localhost:${PORT}`);
});
