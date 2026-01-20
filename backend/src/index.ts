import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import { logger } from './config/logger';
import { connectDatabase } from './database/connectDatabase';
import { globalErrorHandler } from './middlewares/error-handler';
import userRoutes from './modules/users/user_Routes'; // Import the routes

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3033;
connectDatabase();

app.get('/health', (req: Request, res: Response) => {
  logger.info('Health check requested');

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toString(),
  });
});

// Use the user routes
app.use("/api/users", userRoutes);

// Enable error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  logger.info(`Server started on port http://localhost:${PORT}`);
});