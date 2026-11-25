import { Router } from 'express';
import {
  createGuestRsvp,
  getGuestsByInvitationSlug,
  updateGuestPayment,
  exportGuestsCsv,
} from '../controllers/guestController.js';
import { requireHostOrAdminAuth } from '../middleware/auth.js';

const router = Router();

// Confirmación pública del invitado (solo si la invitación está activa)
router.post('/', createGuestRsvp);

// Panel privado del anfitrión (requiere ?token=HOST_TOKEN o header x-host-token)
router.get('/:slug/export', requireHostOrAdminAuth, exportGuestsCsv);
router.patch('/:slug/:guestId/payment', requireHostOrAdminAuth, updateGuestPayment);
router.get('/:slug', requireHostOrAdminAuth, getGuestsByInvitationSlug);

export default router;