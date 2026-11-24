import { Router } from 'express';
import {
  getInvitationBySlug,
  createInvitation,
  addRsvp,
  updateInvitation,
} from '../controllers/invitationController.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:slug', getInvitationBySlug);
router.post('/:slug/rsvp', addRsvp);

// Rutas protegidas para anfitriones
router.post('/', requireAdminAuth, createInvitation);
router.put('/:slug', requireAdminAuth, updateInvitation);

export default router;