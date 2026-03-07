import { Request, Response } from 'express';
import {
  getDailyProgress,
  getWeeklyProgress,
  getMonthlyProgress,
  getCleanerPerformance,
  getCollectionsReconciliation,
  getPeakActivity,
  getBuildingComparisonService,
  getFraudTrendsService,
  getCustomerRatingSummaryService
} from './analytics_service';

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

export const cleanerPerformanceController = async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const data = await getCleanerPerformance(period as string | undefined);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cleaner performance' });
  }
};

export const collectionsReconciliationController = async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const data = await getCollectionsReconciliation(month as string | undefined);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch collections reconciliation' });
  }
};

export const peakActivityController = async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const data = await getPeakActivity((period as any) || 'monthly');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch peak activity data' });
  }
};

export const getBuildingComparison = async (req: Request, res: Response) => {
  try {
    const data = await getBuildingComparisonService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch building comparison' });
  }
};

export const getCustomerRatingSummary = async (req: Request, res: Response) => {
  try {
    const data = await getCustomerRatingSummaryService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch rating summary' });
  }
};

export const getFraudTrends = async (req: Request, res: Response) => {
  try {
    const data = await getFraudTrendsService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch fraud trends' });
  }
};
