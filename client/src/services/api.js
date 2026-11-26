const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_STORAGE_KEY = "invitaciones_admin_token";

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function setAdminToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request(path, options = {}) {
  const { headers, requiresAuth = false, hostToken = "", ...restOptions } = options;
  const authHeaders = {};
  const token = (hostToken || getAdminToken()).trim();

  if (requiresAuth && token) {
    authHeaders.Authorization = `Bearer ${token}`;
    authHeaders["x-host-token"] = token;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
  });

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const fallbackMessage =
      res.status === 401
        ? "Sesión no autorizada. Ingresá tu clave o token de anfitrión."
        : res.status === 403
        ? "Acción no permitida para el estado actual de la invitación."
        : res.status === 404
        ? "Recurso no encontrado"
        : `Error HTTP ${res.status}`;
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

export function getInvitationBySlug(slug) {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return request(`/api/invitations/${encodeURIComponent(cleanSlug)}`);
}

// Público: crea la invitación como borrador ('draft') antes de pagar
export function createInvitation(payload) {
  return request("/api/invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Activa una invitación tras confirmar el pago (requiere ADMIN_TOKEN)
export function activateInvitation(slug) {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return request(`/api/invitations/${encodeURIComponent(cleanSlug)}/activate`, {
    method: "PATCH",
    requiresAuth: true,
  });
}

// Actualiza datos de la invitación (requiere hostToken o ADMIN_TOKEN)
export function updateInvitation(slug, payload, token = "") {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return request(`/api/invitations/${encodeURIComponent(cleanSlug)}`, {
    method: "PUT",
    requiresAuth: true,
    hostToken: token,
    body: JSON.stringify(payload),
  });
}

// Público: registra confirmación RSVP en la colección Guest (solo si está activa)
export function createGuestRsvp(payload) {
  return request("/api/guests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Protegido: obtiene invitados y resumen de asistencia/pagos del anfitrión
export function getGuestsBySlug(slug, token = "") {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  const activeToken = (token || getAdminToken()).trim();
  const query = activeToken ? `?token=${encodeURIComponent(activeToken)}` : "";
  return request(`/api/guests/${encodeURIComponent(cleanSlug)}${query}`, {
    requiresAuth: true,
    hostToken: activeToken,
  });
}

// Protegido: actualiza estado de pago de tarjeta de un invitado
export function updateGuestPayment(slug, guestId, paymentPayload, token = "") {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return request(
    `/api/guests/${encodeURIComponent(cleanSlug)}/${encodeURIComponent(guestId)}/payment`,
    {
      method: "PATCH",
      requiresAuth: true,
      hostToken: token,
      body: JSON.stringify(paymentPayload),
    }
  );
}

// URL directa para descargar CSV compatible con Excel
export function getGuestsExportUrl(slug, token = "") {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  const activeToken = (token || getAdminToken()).trim();
  const query = activeToken ? `?token=${encodeURIComponent(activeToken)}` : "";
  return `${API_URL}/api/guests/${encodeURIComponent(cleanSlug)}/export${query}`;
}

export { API_URL };

// Protegido: lista solicitudes e invitaciones (requiere ADMIN_TOKEN)
export function listInvitations(status = "", adminToken = "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const activeToken = (adminToken || getAdminToken()).trim();

  return request(`/api/invitations${query}`, {
    requiresAuth: true,
    hostToken: activeToken,
    headers: activeToken ? { "x-admin-token": activeToken } : {},
  });
}