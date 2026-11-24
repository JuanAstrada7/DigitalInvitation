import { Router } from 'express';
import {
  createGuestRsvp,
  getGuestsByInvitationSlug,
} from '../controllers/guestController.js';

const router = Router();

router.post('/', createGuestRsvp);
router.get('/:slug', getGuestsByInvitationSlug);

export default router;