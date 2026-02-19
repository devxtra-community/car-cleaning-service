import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import {
  deleteSupervisorService,
  getSupervisorDetailsService,
  getSupervisorWorkersService,
  supervisorReportService,
  toggleSupervisorStatusService,
  updateSupervisorService,
} from './supervisor_services';

export const getSupervisorWorkers = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supervisorId = req.user.userId;
  const workers = await getSupervisorWorkersService(supervisorId);

  return res.json({ success: true, data: workers });
};

export const supervisorReport = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supervisorId = req.user.userId;
  const period = String(req.query.period || 'month');

  if (!['day', 'week', 'month'].includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'period must be day/week/month',
    });
  }

  const report = await supervisorReportService(supervisorId, period);
  return res.json({ success: true, data: report });
};

// Get supervisor by ID (your existing code)
export const getSupervisorById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const supervisor = await getSupervisorDetailsService(id as string);

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: supervisor,
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// Update supervisor
export const updateSupervisor = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    // Validate required fields if needed
    if (updateData.email && !isValidEmail(updateData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const updatedSupervisor = await updateSupervisorService(id, updateData);

    if (!updatedSupervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supervisor updated successfully',
      data: updatedSupervisor,
    });
  } catch (error) {
    console.error('Error updating supervisor:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('email already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }
      if (error.message.includes('building not found')) {
        return res.status(404).json({
          success: false,
          message: 'Building not found',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// Toggle supervisor active/inactive status
export const toggleSupervisorStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value',
      });
    }

    const result = await toggleSupervisorStatusService(id, is_active);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Supervisor ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: result,
    });
  } catch (error) {
    console.error('Error toggling supervisor status:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// Delete supervisor
export const deleteSupervisor = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const result = await deleteSupervisorService(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supervisor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supervisor:', error);

    if (error instanceof Error && error.message.includes('has assigned cleaners')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supervisor with assigned cleaners. Please reassign cleaners first.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
