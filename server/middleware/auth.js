export function requireAdminAuth(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;

  // Si no configuraste ADMIN_TOKEN en .env, evitamos que quede abierto por accidente en producción
  if (!adminToken) {
    return res.status(500).json({
      message: "Falta configurar ADMIN_TOKEN en el servidor",
    });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : req.headers["x-admin-token"]?.toString().trim();

  if (!token || token !== adminToken) {
    return res.status(401).json({
      message: "No autorizado: token de anfitrión inválido o ausente",
    });
  }

  return next();
}