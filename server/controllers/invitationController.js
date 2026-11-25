import Invitation from '../models/Invitation.js';

// Obtener una invitación por su slug (oculta hostToken al público)
export const getInvitationBySlug = async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();
  const invitation = await Invitation.findOne({ slug }).select('-hostToken');

  if (!invitation) {
    return res.status(404).json({ message: 'Invitación no encontrada' });
  }

  if (invitation.status === 'expired') {
    return res.status(410).json({
      message: 'Esta invitación ha expirado',
      status: invitation.status,
    });
  }

  res.json(invitation);
};

// Crear borrador público (el cliente arma su invitación antes de pagar)
export const createInvitation = async (req, res) => {
  try {
    const { slug, templateId, hostContact, eventData, locations, giftRegistry } = req.body;

    if (!slug || !eventData?.title || !eventData?.eventDate) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios: slug, título y fecha del evento',
      });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const existing = await Invitation.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(409).json({ message: 'Ese enlace personalizado ya está en uso' });
    }

    const invitation = await Invitation.create({
      slug: normalizedSlug,
      templateId: templateId || 'Vintage',
      status: 'draft', // Siempre nace como borrador hasta el pago
      isPaid: false,
      hostContact,
      eventData,
      locations,
      giftRegistry,
    });

    res.status(201).json({
      message: 'Borrador creado correctamente',
      invitation,
      hostPanelUrl: `/panel/${invitation.slug}?token=${invitation.hostToken}`,
    });
  } catch (error) {
    console.error('Error al crear borrador:', error);
    res.status(500).json({ message: 'Error interno al crear la invitación' });
  }
};

// Activar invitación tras confirmar el pago (solo Admin o Webhook)
export const activateInvitation = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const invitation = await Invitation.findOne({ slug });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    invitation.status = 'active';
    invitation.isPaid = true;
    await invitation.save();

    res.json({
      message: 'Invitación activada y lista para compartir por WhatsApp',
      publicUrl: `/invitacion/${invitation.slug}`,
      hostPanelUrl: `/panel/${invitation.slug}?token=${invitation.hostToken}`,
      invitation,
    });
  } catch (error) {
    console.error('Error al activar invitación:', error);
    res.status(500).json({ message: 'Error interno al activar la invitación' });
  }
};

// Actualizar datos de una invitación (Anfitrión con su token o Admin)
export const updateInvitation = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const invitation = req.invitation || (await Invitation.findOne({ slug }));

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    const { templateId, hostContact, eventData, locations, giftRegistry } = req.body;

    if (templateId !== undefined) invitation.templateId = templateId;
    if (hostContact !== undefined) invitation.hostContact = hostContact;

    // Solo el admin general puede cambiar status o isPaid manualmente
    if (req.isAdmin) {
      if (req.body.status !== undefined) invitation.status = req.body.status;
      if (req.body.isPaid !== undefined) invitation.isPaid = Boolean(req.body.isPaid);
    }

    if (eventData && typeof eventData === 'object') {
      const currentEventData =
        typeof invitation.eventData?.toObject === 'function'
          ? invitation.eventData.toObject()
          : invitation.eventData || {};
      invitation.eventData = { ...currentEventData, ...eventData };
    }

    if (locations !== undefined) {
      invitation.locations = locations;
    }

    if (giftRegistry && typeof giftRegistry === 'object') {
      const currentGiftRegistry =
        typeof invitation.giftRegistry?.toObject === 'function'
          ? invitation.giftRegistry.toObject()
          : invitation.giftRegistry || {};
      invitation.giftRegistry = { ...currentGiftRegistry, ...giftRegistry };
    }

    await invitation.save();
    return res.json(invitation);
  } catch (error) {
    console.error('Error al actualizar invitación:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la invitación' });
  }
};