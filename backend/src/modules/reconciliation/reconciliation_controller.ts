import { Request, Response } from 'express';
import {
  getBuildingReconciliation,
  getCompanyReconciliationSummary,
} from './reconciliation_service';

interface CycleParams {
  cycleId: string;
}

export const getReconciliationController = async (req: Request<CycleParams>, res: Response) => {
  try {
    const { cycleId } = req.params;

    const result = await getBuildingReconciliation(cycleId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Something went wrong',
    });
  }
};
export const getCompanySummaryController = async (
  req: Request<{ cycleId: string }>,
  res: Response
) => {
  try {
    const { cycleId } = req.params;

    const result = await getCompanyReconciliationSummary(cycleId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Something went wrong',
    });
  }
};
