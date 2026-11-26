import { Router } from 'express';
import {
  listInvitations,
  getInvitationBySlug,
  createInvitation,
  activateInvitation,
  updateInvitation,
} from '../controllers/invitationController.js';
import { requireAdminAuth, requireHostOrAdminAuth } from '../middleware/auth.js';

const router = Router();

// Rutas públicas
router.get('/', requireAdminAuth, listInvitations);
router.get('/:slug', getInvitationBySlug);
router.post('/', createInvitation); // Crea el borrador antes del pago

// Rutas protegidas
router.put('/:slug', requireHostOrAdminAuth, updateInvitation);
router.patch('/:slug/activate', requireAdminAuth, activateInvitation); // Activa tras pagar

export default router;