import { Router, Request, Response } from 'express';
import {
  getAllAdminsService,
  getAdminByIdService,
  updateAdminService,
  deleteAdminService,
  toggleAdminStatusService,
  getAllAccountantsService,
  getAccountantByIdService,
  updateAccountantService,
  deleteAccountantService,
  toggleAccountantStatusService,
} from './Adminaccountantservice';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES   /api/admins
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/admins */
interface IDparams {
  id: string;
}
router.get('/admins', async (_req: Request, res: Response) => {
  try {
    const data = await getAllAdminsService();
    res.json(data);
  } catch (err) {
    console.error('getAllAdmins error:', err);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

/** GET /api/admins/:id */
router.get('/admins/:id', async (req: Request<IDparams>, res: Response) => {
  try {
    const data = await getAdminByIdService(req.params.id);
    if (!data) return res.status(404).json({ message: 'Admin not found' });
    res.json(data);
  } catch (err) {
    console.error('getAdminById error:', err);
    res.status(500).json({ message: 'Failed to fetch admin' });
  }
});

/** PUT /api/admins/:id */
router.put('/admins/:id', async (req: Request<IDparams>, res: Response) => {
  try {
    const updated = await updateAdminService(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Admin not found or no changes' });
    res.json(updated);
  } catch (err) {
    console.error('updateAdmin error:', err);
    res.status(500).json({ message: 'Failed to update admin' });
  }
});

/** DELETE /api/admins/:id */
router.delete('/admins/:id', async (req: Request<IDparams>, res: Response) => {
  try {
    const deleted = await deleteAdminService(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('deleteAdmin error:', err);
    res.status(500).json({ message: 'Failed to delete admin' });
  }
});

/** PATCH /api/admins/:id/toggle-status */
router.patch('/admins/:id/toggle-status', async (req: Request<IDparams>, res: Response) => {
  try {
    const { is_active } = req.body as { is_active: boolean };
    if (typeof is_active !== 'boolean')
      return res.status(400).json({ message: '`is_active` boolean required' });
    const result = await toggleAdminStatusService(req.params.id, is_active);
    if (!result) return res.status(404).json({ message: 'Admin not found' });
    res.json(result);
  } catch (err) {
    console.error('toggleAdminStatus error:', err);
    res.status(500).json({ message: 'Failed to toggle admin status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTANT ROUTES   /api/accountants
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/accountants */
router.get('/accountants', async (_req: Request, res: Response) => {
  try {
    const data = await getAllAccountantsService();
    res.json(data);
  } catch (err) {
    console.error('getAllAccountants error:', err);
    res.status(500).json({ message: 'Failed to fetch accountants' });
  }
});

/** GET /api/accountants/:id */
router.get('/accountants/:id', async (req: Request<IDparams>, res: Response) => {
  try {
    const data = await getAccountantByIdService(req.params.id);
    if (!data) return res.status(404).json({ message: 'Accountant not found' });
    res.json(data);
  } catch (err) {
    console.error('getAccountantById error:', err);
    res.status(500).json({ message: 'Failed to fetch accountant' });
  }
});

/** PUT /api/accountants/:id */
router.put('/accountants/:id', async (req: Request<IDparams>, res: Response) => {
  try {
    const updated = await updateAccountantService(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Accountant not found or no changes' });
    res.json(updated);
  } catch (err) {
    console.error('updateAccountant error:', err);
    res.status(500).json({ message: 'Failed to update accountant' });
  }
});

/** DELETE /api/accountants/:id */
router.delete('/accountants/:id', async (req: Request<IDparams>, res: Response) => {
  try {
    const deleted = await deleteAccountantService(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Accountant not found' });
    res.json({ message: 'Accountant deleted successfully' });
  } catch (err) {
    console.error('deleteAccountant error:', err);
    res.status(500).json({ message: 'Failed to delete accountant' });
  }
});

/** PATCH /api/accountants/:id/toggle-status */
router.patch('/accountants/:id/toggle-status', async (req: Request<IDparams>, res: Response) => {
  try {
    const { is_active } = req.body as { is_active: boolean };
    if (typeof is_active !== 'boolean')
      return res.status(400).json({ message: '`is_active` boolean required' });
    const result = await toggleAccountantStatusService(req.params.id, is_active);
    if (!result) return res.status(404).json({ message: 'Accountant not found' });
    res.json(result);
  } catch (err) {
    console.error('toggleAccountantStatus error:', err);
    res.status(500).json({ message: 'Failed to toggle accountant status' });
  }
});

export default router;