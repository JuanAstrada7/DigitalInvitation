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
  const { headers, requiresAuth = false, ...restOptions } = options;
  const authHeaders = {};

  if (requiresAuth) {
    const token = getAdminToken();
    if (token) {
      authHeaders.Authorization = `Bearer ${token}`;
    }
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
        ? "Sesión no autorizada. Ingresá tu clave de anfitrión."
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

export function createInvitation(payload) {
  return request("/api/invitations", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export function updateInvitation(slug, payload) {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return request(`/api/invitations/${encodeURIComponent(cleanSlug)}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export function addInvitationRsvp(slug, payload) {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return request(`/api/invitations/${encodeURIComponent(cleanSlug)}/rsvp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { API_URL };