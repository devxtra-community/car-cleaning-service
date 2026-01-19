import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import { logger } from './config/logger';
import { connectDatabase } from './database/connectDatabase';
import { globalErrorHandler } from './middlewares/error-handler';

const app = express();
app.use(express.json());

const PORT = 3030;
connectDatabase();

app.get('/health', (req: Request, res: Response) => {
  logger.info('Health check requested');

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toString(),
  });
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  logger.info(`Server started on port http://localhost:${PORT}`);
});
