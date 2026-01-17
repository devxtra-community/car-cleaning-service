import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { logger } from "./config/logger";
import { connectDatabase } from "./database/connectDatabase";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3030;

const startServer = async () => {
  await connectDatabase();

  app.get("/health", (req: Request, res: Response) => {
    logger.info("Health check requested");

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toString(),
    });
  });

  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  });
};

startServer();
