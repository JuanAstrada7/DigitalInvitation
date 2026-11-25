import Invitation from '../models/Invitation.js';

export function requireAdminAuth(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return res.status(500).json({
      message: 'Falta configurar ADMIN_TOKEN en el servidor',
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : req.headers['x-admin-token']?.toString().trim();

  if (!token || token !== adminToken) {
    return res.status(401).json({
      message: 'No autorizado: token de administrador inválido o ausente',
    });
  }

  return next();
}

export async function requireHostOrAdminAuth(req, res, next) {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (
          req.headers['x-host-token'] ||
          req.headers['x-admin-token'] ||
          req.query.token
        )?.toString().trim();

    if (!token) {
      return res.status(401).json({
        message: 'Token de anfitrión requerido',
      });
    }

    // Si es el administrador general, pasa directo
    if (adminToken && token === adminToken) {
      req.isAdmin = true;
      return next();
    }

    // Si es el anfitrión, validamos contra el hostToken de la invitación
    const slug = req.params.slug?.toLowerCase().trim();
    if (!slug) {
      return res.status(400).json({ message: 'Slug de invitación requerido' });
    }

    const invitation = await Invitation.findOne({ slug });
    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    if (invitation.hostToken !== token) {
      return res.status(403).json({
        message: 'No autorizado: el token no corresponde a esta invitación',
      });
    }

    req.invitation = invitation;
    return next();
  } catch (error) {
    console.error('Error en autenticación de anfitrión:', error);
    return res.status(500).json({ message: 'Error interno de autenticación' });
  }
}