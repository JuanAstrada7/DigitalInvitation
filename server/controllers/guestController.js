import Guest from '../models/Guest.js';
import Invitation from '../models/Invitation.js';

const PAYMENT_LABELS = {
  pending: 'Pendiente',
  partial: 'Señado',
  paid: 'Pagado',
  exempt: 'Sin cargo',
};

// Registrar confirmación RSVP de un invitado (Público, solo si la invitación está activa)
export const createGuestRsvp = async (req, res) => {
  try {
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

    if (invitation.status !== 'active') {
      return res.status(403).json({
        message: 'Esta invitación aún está en modo borrador y no admite confirmaciones',
      });
    }

    const guest = await Guest.create({
      invitationId: invitation._id,
      fullName: fullName.trim(),
      attending,
      companions: attending ? Math.max(0, Number(companions) || 0) : 0,
      dietaryRestrictions: dietaryRestrictions?.trim() || '',
      songRequest: songRequest?.trim() || '',
      message: message?.trim() || '',
      cardPayment: {
        status: attending ? 'pending' : 'exempt',
        amountPaid: 0,
        notes: '',
      },
    });

    res.status(201).json({
      message: 'Confirmación registrada correctamente',
      guest,
    });
  } catch (error) {
    console.error('Error al registrar RSVP:', error);
    res.status(500).json({ message: 'Error interno al registrar confirmación' });
  }
};

// Listar confirmaciones y métricas de pago (Protegido: Anfitrión o Admin)
export const getGuestsByInvitationSlug = async (req, res) => {
  try {
    const invitation =
      req.invitation ||
      (await Invitation.findOne({ slug: req.params.slug.toLowerCase().trim() }));

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    const guests = await Guest.find({ invitationId: invitation._id }).sort({ createdAt: -1 });

    const summary = guests.reduce(
      (acc, g) => {
        const groupSize = 1 + (g.companions || 0);
        if (g.attending) {
          acc.confirmedGroups += 1;
          acc.totalPeople += groupSize;

          const payStatus = g.cardPayment?.status || 'pending';
          if (payStatus === 'paid') acc.cardsPaid += groupSize;
          else if (payStatus === 'partial') acc.cardsPartial += groupSize;
          else if (payStatus === 'pending') acc.cardsPending += groupSize;
        } else {
          acc.declinedGroups += 1;
        }
        acc.totalCollected += Number(g.cardPayment?.amountPaid) || 0;
        return acc;
      },
      {
        confirmedGroups: 0,
        declinedGroups: 0,
        totalPeople: 0,
        cardsPaid: 0,
        cardsPartial: 0,
        cardsPending: 0,
        totalCollected: 0,
      }
    );

    res.json({
      eventTitle: invitation.eventData?.title,
      cardPrice: invitation.eventData?.cardPrice || 0,
      status: invitation.status,
      summary,
      guests,
    });
  } catch (error) {
    console.error('Error al listar invitados:', error);
    res.status(500).json({ message: 'Error interno al obtener invitados' });
  }
};

// Actualizar estado de pago de tarjeta de un invitado (Protegido: Anfitrión o Admin)
export const updateGuestPayment = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { status, amountPaid, notes } = req.body;

    const validStatuses = ['pending', 'partial', 'paid', 'exempt'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado de pago inválido' });
    }

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Invitado no encontrado' });
    }

    // Verificamos que el invitado pertenezca a la invitación autorizada en el middleware
    if (req.invitation && String(guest.invitationId) !== String(req.invitation._id)) {
      return res.status(403).json({ message: 'Este invitado no pertenece a tu evento' });
    }

    if (status !== undefined) guest.cardPayment.status = status;
    if (amountPaid !== undefined) guest.cardPayment.amountPaid = Math.max(0, Number(amountPaid) || 0);
    if (notes !== undefined) guest.cardPayment.notes = String(notes).trim();

    await guest.save();
    res.json({ message: 'Pago actualizado', guest });
  } catch (error) {
    console.error('Error al actualizar pago de tarjeta:', error);
    res.status(500).json({ message: 'Error interno al actualizar pago' });
  }
};

// Exportar lista de invitados y pagos en CSV compatible con Excel (Protegido)
export const exportGuestsCsv = async (req, res) => {
  try {
    const invitation =
      req.invitation ||
      (await Invitation.findOne({ slug: req.params.slug.toLowerCase().trim() }));

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    const guests = await Guest.find({ invitationId: invitation._id }).sort({ fullName: 1 });

    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const headers = [
      'Nombre y Apellido',
      'Asistencia',
      'Acompañantes',
      'Total Personas',
      'Restricción Alimentaria',
      'Estado Tarjeta',
      'Monto Abonado',
      'Notas de Pago',
      'Canción Sugerida',
      'Mensaje',
      'Fecha Confirmación',
    ];

    const rows = guests.map((g) => {
      const totalPersonas = g.attending ? 1 + (g.companions || 0) : 0;
      const payLabel = PAYMENT_LABELS[g.cardPayment?.status] || 'Pendiente';
      const dateStr = g.createdAt
        ? new Date(g.createdAt).toLocaleDateString('es-AR')
        : '';

      return [
        escapeCsv(g.fullName),
        escapeCsv(g.attending ? 'Asiste' : 'No asiste'),
        g.attending ? g.companions || 0 : 0,
        totalPersonas,
        escapeCsv(g.dietaryRestrictions || 'Ninguna'),
        escapeCsv(payLabel),
        g.cardPayment?.amountPaid || 0,
        escapeCsv(g.cardPayment?.notes || ''),
        escapeCsv(g.songRequest || ''),
        escapeCsv(g.message || ''),
        escapeCsv(dateStr),
      ].join(';'); // Punto y coma para que Excel en español separe columnas automático
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invitados-${invitation.slug}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    res.status(500).json({ message: 'Error interno al generar el archivo' });
  }
};