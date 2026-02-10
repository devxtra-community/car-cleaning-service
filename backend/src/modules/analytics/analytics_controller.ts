import { Request, Response } from 'express';
import { getDailyProgress, getWeeklyProgress, getMonthlyProgress } from './analytics_service';

export const dailyProgressController = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const data = await getDailyProgress(date as string | undefined);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch daily progress' });
  }
};

export const weeklyProgressController = async (req: Request, res: Response) => {
  try {
    const { week } = req.query;
    const data = await getWeeklyProgress(week as string | undefined);

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch weekly progress' });
  }
};

export const monthlyProgressController = async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const data = await getMonthlyProgress(month as string | undefined);

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch monthly progress' });
  }
};
