import Guest from '../models/Guest.js';
import Invitation from '../models/Invitation.js';

// Registrar confirmación RSVP de un invitado
export const createGuestRsvp = async (req, res) => {
  const { slug, fullName, attending, companions, dietaryRestrictions, songRequest, message } =
    req.body;

  if (!slug || !fullName || typeof attending !== 'boolean') {
    return res.status(400).json({
      message: 'Faltan datos obligatorios: slug, fullName y attending (booleano)',
    });
  }

  const invitation = await Invitation.findOne({ slug: slug.toLowerCase().trim() });
  if (!invitation) {
    return res.status(404).json({ message: 'Invitación no encontrada' });
  }

  const guest = await Guest.create({
    invitationId: invitation._id,
    fullName,
    attending,
    companions: attending ? Number(companions) || 0 : 0,
    dietaryRestrictions,
    songRequest,
    message,
  });

  res.status(201).json({
    message: 'Confirmación registrada correctamente',
    guest,
  });
};

// Listar confirmaciones de una invitación (para el Dashboard)
export const getGuestsByInvitationSlug = async (req, res) => {
  const invitation = await Invitation.findOne({
    slug: req.params.slug.toLowerCase().trim(),
  });

  if (!invitation) {
    return res.status(404).json({ message: 'Invitación no encontrada' });
  }

  const guests = await Guest.find({ invitationId: invitation._id }).sort({ createdAt: -1 });

  const summary = guests.reduce(
    (acc, g) => {
      if (g.attending) {
        acc.confirmedGroups += 1;
        acc.totalPeople += 1 + (g.companions || 0);
      } else {
        acc.declinedGroups += 1;
      }
      return acc;
    },
    { confirmedGroups: 0, declinedGroups: 0, totalPeople: 0 }
  );

  res.json({ summary, guests });
};