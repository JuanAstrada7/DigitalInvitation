import Invitation from '../models/Invitation.js';

// Obtener una invitación pública por su slug
export const getInvitationBySlug = async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();

  const invitation = await Invitation.findOne({ slug });

  if (!invitation) {
    return res.status(404).json({ message: 'Invitación no encontrada' });
  }

  if (invitation.status !== 'active') {
    return res.status(403).json({
      message: 'Esta invitación aún no está activa',
      status: invitation.status,
    });
  }

  res.json(invitation);
};

// Crear una nueva invitación (útil para pruebas o panel admin)
export const createInvitation = async (req, res) => {
  const { slug, templateId, status, eventData, locations, giftRegistry } = req.body;

  const existing = await Invitation.findOne({ slug: slug?.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: 'Ese slug ya está en uso' });
  }

  const invitation = await Invitation.create({
    slug,
    templateId,
    status,
    eventData,
    locations,
    giftRegistry,
  });

  res.status(201).json(invitation);
};

// Registrar confirmación de asistencia (RSVP) en una invitación
export const addRsvp = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const { guestName, attending, guestsCount, notes } = req.body;

    if (!guestName || !String(guestName).trim()) {
      return res.status(400).json({ message: 'El nombre del invitado es obligatorio' });
    }

    const invitation = await Invitation.findOne({ slug });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    if (invitation.status !== 'active') {
      return res.status(403).json({
        message: 'Esta invitación aún no está activa',
        status: invitation.status,
      });
    }

    const willAttend = Boolean(attending);
    const parsedCount = willAttend ? Math.max(1, Number(guestsCount) || 1) : 0;

    invitation.rsvps.push({
      guestName: String(guestName).trim(),
      attending: willAttend,
      guestsCount: parsedCount,
      notes: notes ? String(notes).trim() : '',
    });

    await invitation.save();

    return res.status(201).json({
      message: 'Confirmación registrada con éxito',
      rsvps: invitation.rsvps,
    });
  } catch (error) {
    console.error('Error al guardar RSVP:', error);
    return res.status(500).json({ message: 'Error interno al guardar la confirmación' });
  }
};

// Actualizar una invitación existente por su slug
export const updateInvitation = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const invitation = await Invitation.findOne({ slug });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    const { templateId, status, eventData, locations, giftRegistry } = req.body;

    if (templateId !== undefined) {
      invitation.templateId = templateId;
    }

    if (status !== undefined) {
      invitation.status = status;
    }

    if (eventData && typeof eventData === 'object') {
      const currentEventData =
        typeof invitation.eventData?.toObject === 'function'
          ? invitation.eventData.toObject()
          : invitation.eventData || {};

      invitation.eventData = {
        ...currentEventData,
        ...eventData,
      };
    }

    if (locations !== undefined) {
      invitation.locations = locations;
    }

    if (giftRegistry && typeof giftRegistry === 'object') {
      const currentGiftRegistry =
        typeof invitation.giftRegistry?.toObject === 'function'
          ? invitation.giftRegistry.toObject()
          : invitation.giftRegistry || {};

      invitation.giftRegistry = {
        ...currentGiftRegistry,
        ...giftRegistry,
      };
    }

    await invitation.save();

    return res.json(invitation);
  } catch (error) {
    console.error('Error al actualizar invitación:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la invitación' });
  }
};