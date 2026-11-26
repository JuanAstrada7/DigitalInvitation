import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getInvitationBySlug,
  createInvitation,
  activateInvitation,
  updateInvitation,
  getGuestsBySlug,
  updateGuestPayment,
  getGuestsExportUrl,
  listInvitations,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from "../services/api";

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "partial", label: "Señado" },
  { value: "paid", label: "Pagado" },
  { value: "exempt", label: "Sin cargo" },
];

function toDatetimeLocalValue(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatGalleryForInput(galleryImages) {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return "";
  return galleryImages
    .map((item) => (typeof item === "string" ? item : item?.url || ""))
    .filter(Boolean)
    .join("\n");
}

function GuestPaymentRow({ guest, slug, token, onSaved }) {
  const [status, setStatus] = useState(guest.cardPayment?.status || "pending");
  const [amountPaid, setAmountPaid] = useState(guest.cardPayment?.amountPaid ?? 0);
  const [notes, setNotes] = useState(guest.cardPayment?.notes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(guest.cardPayment?.status || "pending");
    setAmountPaid(guest.cardPayment?.amountPaid ?? 0);
    setNotes(guest.cardPayment?.notes || "");
  }, [guest]);

  const totalPeople = guest.attending ? 1 + (Number(guest.companions) || 0) : 0;

  async function handleSavePayment() {
    setSaving(true);
    try {
      await updateGuestPayment(
        slug,
        guest._id,
        {
          status,
          amountPaid: Number(amountPaid) || 0,
          notes,
        },
        token
      );
      Swal.fire({
        icon: "success",
        title: "Pago guardado",
        text: `Actualizado para ${guest.fullName}`,
        timer: 1200,
        showConfirmButton: false,
      });
      if (onSaved) await onSaved();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar pago",
        text: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <div className="fw-semibold">{guest.fullName}</div>
        {guest.dietaryRestrictions && (
          <div className="small text-warning-emphasis">Dieta: {guest.dietaryRestrictions}</div>
        )}
        {guest.message && <div className="small text-muted">"{guest.message}"</div>}
      </td>
      <td>
        <span className={`badge ${guest.attending ? "text-bg-success" : "text-bg-secondary"}`}>
          {guest.attending ? "Asiste" : "No asiste"}
        </span>
      </td>
      <td>
        {guest.attending ? (
          <>
            {totalPeople}{" "}
            <span className="text-muted small">({Number(guest.companions) || 0} acomp.)</span>
          </>
        ) : (
          0
        )}
      </td>
      <td style={{ minWidth: "135px" }}>
        <select
          className="form-select form-select-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {PAYMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td style={{ minWidth: "120px" }}>
        <input
          type="number"
          min="0"
          step="100"
          className="form-control form-control-sm"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
        />
      </td>
      <td style={{ minWidth: "150px" }}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Ej. Transferencia, efectivo..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </td>
      <td>
        <button
          type="button"
          className="btn btn-sm btn-outline-dark"
          disabled={saving}
          onClick={handleSavePayment}
        >
          {saving ? "..." : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = (searchParams.get("token") || "").trim();

  const [selectedSlug, setSelectedSlug] = useState(routeSlug || "prueba-boda");
  const [invitation, setInvitation] = useState(null);
  const [guestsData, setGuestsData] = useState({ summary: null, guests: [] });
  const [loadingInv, setLoadingInv] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [activating, setActivating] = useState(false);

  // Token guardado en sesión (anfitrión o ADMIN_TOKEN) vs input del formulario
  const [savedToken, setSavedToken] = useState(() => queryToken || getAdminToken());
  const [adminTokenInput, setAdminTokenInput] = useState(() => queryToken || getAdminToken());
  const hasAdminToken = Boolean(savedToken);

  // Bandeja de solicitudes e invitaciones (solo visible con ADMIN_TOKEN)
  const [ordersList, setOrdersList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Crear borrador (antes del pago)
  const [slug, setSlug] = useState("");
  const [templateId, setTemplateId] = useState("Vintage");
  const [eventType, setEventType] = useState("wedding");
  const [title, setTitle] = useState("");
  const [hostsText, setHostsText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [dressCode, setDressCode] = useState("Elegante");
  const [cardPrice, setCardPrice] = useState(0);
  const [hostName, setHostName] = useState("");
  const [hostWhatsapp, setHostWhatsapp] = useState("");
  const [creating, setCreating] = useState(false);

  // Editar invitación existente
  const [editTemplateId, setEditTemplateId] = useState("Vintage");
  const [editStatus, setEditStatus] = useState("draft");
  const [editTitle, setEditTitle] = useState("");
  const [editHostsText, setEditHostsText] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editDressCode, setEditDressCode] = useState("");
  const [editCardPrice, setEditCardPrice] = useState(0);
  const [editWelcomeMessage, setEditWelcomeMessage] = useState("");
  const [editMusicUrl, setEditMusicUrl] = useState("");
  const [editGalleryText, setEditGalleryText] = useState("");
  const [editGiftEnabled, setEditGiftEnabled] = useState(false);
  const [editGiftMessage, setEditGiftMessage] = useState("");
  const [editGiftAlias, setEditGiftAlias] = useState("");
  const [editGiftCbu, setEditGiftCbu] = useState("");
  const [editLocationsJson, setEditLocationsJson] = useState("[]");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (queryToken) {
      setAdminToken(queryToken);
      setSavedToken(queryToken);
      setAdminTokenInput(queryToken);
    }
  }, [queryToken]);

  useEffect(() => {
    if (routeSlug) {
      setSelectedSlug(routeSlug);
    }
  }, [routeSlug]);

  function hydrateEditForm(inv) {
    if (!inv) return;
    const ev = inv.eventData || {};
    const gift = inv.giftRegistry || {};

    setEditTemplateId(inv.templateId || "Vintage");
    setEditStatus(inv.status || "draft");
    setEditTitle(ev.title || "");
    setEditHostsText(Array.isArray(ev.hosts) ? ev.hosts.join(" & ") : "");
    setEditEventDate(toDatetimeLocalValue(ev.eventDate));
    setEditDressCode(ev.dressCode || "");
    setEditCardPrice(ev.cardPrice ?? 0);
    setEditWelcomeMessage(ev.welcomeMessage || "");
    setEditMusicUrl(ev.musicUrl || "");
    setEditGalleryText(formatGalleryForInput(ev.galleryImages));
    setEditGiftEnabled(Boolean(gift.enabled));
    setEditGiftMessage(gift.message || "");
    setEditGiftAlias(gift.alias || "");
    setEditGiftCbu(gift.cbu || "");
    setEditLocationsJson(
      JSON.stringify(Array.isArray(inv.locations) ? inv.locations : [], null, 2)
    );
  }

  async function fetchAdminOrders(tokenToUse = savedToken, filter = statusFilter) {
    if (!tokenToUse) {
      setOrdersList([]);
      return;
    }

    setLoadingOrders(true);
    try {
      const queryStatus = filter === "all" ? "" : filter;
      const list = await listInvitations(queryStatus, tokenToUse);
      setOrdersList(Array.isArray(list) ? list : []);
    } catch {
      setOrdersList([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    if (savedToken) {
      fetchAdminOrders(savedToken, statusFilter);
    } else {
      setOrdersList([]);
    }
  }, [savedToken, statusFilter]);

  function handleSaveAdminToken(e) {
    e.preventDefault();
    const cleanToken = adminTokenInput.trim();
    if (!cleanToken) {
      Swal.fire({
        icon: "warning",
        title: "Clave vacía",
        text: "Ingresá tu token de anfitrión o ADMIN_TOKEN.",
      });
      return;
    }

    setAdminToken(cleanToken);
    setSavedToken(cleanToken);
    setAdminTokenInput(cleanToken);

    if (invitation?.slug) {
      loadInvitationAndGuests(invitation.slug, cleanToken);
    }

    Swal.fire({
      icon: "success",
      title: "Clave guardada",
      text: "Se enviará en las gestiones del panel.",
      timer: 1300,
      showConfirmButton: false,
    });
  }

  function handleClearAdminToken() {
    clearAdminToken();
    setSavedToken("");
    setAdminTokenInput("");
    setOrdersList([]);
    setGuestsData({ summary: null, guests: [] });

    Swal.fire({
      icon: "info",
      title: "Sesión cerrada",
      text: "Se eliminó la clave de esta sesión.",
      timer: 1300,
      showConfirmButton: false,
    });
  }

  async function loadGuestsOnly(targetSlug, tokenToUse = savedToken) {
    const cleanSlug = String(targetSlug || "").trim().toLowerCase();
    if (!cleanSlug || !tokenToUse) return;
    try {
      const data = await getGuestsBySlug(cleanSlug, tokenToUse);
      setGuestsData({
        summary: data.summary || null,
        guests: Array.isArray(data.guests) ? data.guests : [],
      });
    } catch {
      setGuestsData({ summary: null, guests: [] });
    }
  }

  async function loadInvitationAndGuests(targetSlug, tokenToUse = savedToken) {
    const cleanSlug = String(targetSlug || "").trim().toLowerCase();
    if (!cleanSlug) return;

    setLoadingInv(true);
    try {
      const inv = await getInvitationBySlug(cleanSlug);
      setInvitation(inv);
      hydrateEditForm(inv);

      if (tokenToUse) {
        await loadGuestsOnly(cleanSlug, tokenToUse);
      } else {
        setGuestsData({ summary: null, guests: [] });
      }
    } catch (err) {
      setInvitation(null);
      setGuestsData({ summary: null, guests: [] });
      Swal.fire({
        icon: "error",
        title: "Error al consultar",
        text: err.message,
      });
    } finally {
      setLoadingInv(false);
    }
  }

  useEffect(() => {
    loadInvitationAndGuests(selectedSlug, savedToken);
  }, []);

  async function handleCreateDraft(e) {
    e.preventDefault();

    if (!slug.trim() || !title.trim() || !eventDate) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Completá slug, título y fecha del evento para generar el borrador.",
      });
      return;
    }

    const payload = {
      slug: slug.trim().toLowerCase(),
      templateId,
      hostContact: {
        name: hostName.trim(),
        whatsapp: hostWhatsapp.trim(),
      },
      eventData: {
        eventType,
        title: title.trim(),
        hosts: hostsText
          .split("&")
          .map((h) => h.trim())
          .filter(Boolean),
        eventDate: new Date(eventDate).toISOString(),
        dressCode: dressCode.trim() || "Elegante",
        cardPrice: Number(cardPrice) || 0,
      },
    };

    setCreating(true);
    try {
      const res = await createInvitation(payload);
      const createdInv = res.invitation || res;
      const generatedToken = createdInv.hostToken || "";

      const activeTokenForSession = savedToken || generatedToken;
      if (generatedToken && !savedToken) {
        setAdminToken(generatedToken);
        setSavedToken(generatedToken);
        setAdminTokenInput(generatedToken);
      }

      setSelectedSlug(createdInv.slug);
      setInvitation(createdInv);
      hydrateEditForm(createdInv);

      Swal.fire({
        icon: "success",
        title: "Borrador creado (Vista previa)",
        html: `
          <p class="mb-2">Ya podés revisar tu invitación antes de activar y compartir por WhatsApp.</p>
          ${
            res.hostPanelUrl
              ? `<p class="small text-muted mb-0">Guardá tu link de gestión: <code>${res.hostPanelUrl}</code></p>`
              : ""
          }
        `,
      });

      setSlug("");
      setTitle("");
      setHostsText("");
      setEventDate("");
      setHostName("");
      setHostWhatsapp("");
      await loadGuestsOnly(createdInv.slug, activeTokenForSession);
      await fetchAdminOrders(activeTokenForSession, statusFilter);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo crear el borrador",
        text: err.message,
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleActivateInvitation() {
    if (!invitation?.slug) return;
    setActivating(true);
    try {
      const res = await activateInvitation(invitation.slug);
      const updated = res.invitation || { ...invitation, status: "active", isPaid: true };
      setInvitation(updated);
      hydrateEditForm(updated);
      await fetchAdminOrders(savedToken, statusFilter);
      Swal.fire({
        icon: "success",
        title: "Invitación activada",
        text: "Ya está habilitada para compartir por WhatsApp y recibir confirmaciones.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo activar",
        text: err.message,
      });
    } finally {
      setActivating(false);
    }
  }

  async function handleUpdateInvitation(e) {
    e.preventDefault();
    if (!invitation?.slug) return;

    let parsedLocations = invitation.locations || {};
    try {
      const raw = editLocationsJson.trim();
      if (raw) {
        parsedLocations = JSON.parse(raw);
      }
    } catch (err) {
      Swal.fire({
        icon: "warning",
        title: "JSON de ubicaciones inválido",
        text: err.message,
      });
      return;
    }

    const galleryImages = editGalleryText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      templateId: editTemplateId,
      status: editStatus,
      eventData: {
        title: editTitle.trim(),
        hosts: editHostsText
          .split("&")
          .map((h) => h.trim())
          .filter(Boolean),
        eventDate: editEventDate ? new Date(editEventDate).toISOString() : undefined,
        dressCode: editDressCode.trim(),
        cardPrice: Number(editCardPrice) || 0,
        welcomeMessage: editWelcomeMessage.trim(),
        musicUrl: editMusicUrl.trim(),
        galleryImages,
      },
      giftRegistry: {
        enabled: editGiftEnabled,
        message: editGiftMessage.trim(),
        alias: editGiftAlias.trim(),
        cbu: editGiftCbu.trim(),
      },
      locations: parsedLocations,
    };

    setSavingEdit(true);
    try {
      const updated = await updateInvitation(invitation.slug, payload, savedToken);
      setInvitation(updated);
      hydrateEditForm(updated);
      await fetchAdminOrders(savedToken, statusFilter);
      Swal.fire({
        icon: "success",
        title: "Invitación actualizada",
        text: `Cambios guardados en /${updated.slug}`,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: err.message,
      });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDownloadCsv() {
    if (!invitation?.slug) return;
    if (!savedToken) {
      Swal.fire({
        icon: "warning",
        title: "Token requerido",
        text: "Cargá tu token de anfitrión o ADMIN_TOKEN para exportar la planilla.",
      });
      return;
    }

    setExportingCsv(true);
    try {
      const url = getGuestsExportUrl(invitation.slug, savedToken);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "x-host-token": savedToken,
        },
      });
      if (!res.ok) {
        throw new Error("No se pudo descargar el archivo CSV");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `invitados-${invitation.slug}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al exportar",
        text: err.message,
      });
    } finally {
      setExportingCsv(false);
    }
  }

  const shareOnWhatsApp = () => {
    if (!invitation?.slug) return;
    const publicUrl = `${window.location.origin}/${invitation.slug}`;
    const text = `¡Te invito a ${
      invitation.eventData?.title || "nuestro evento"
    }! Mirá todos los detalles y confirmá tu asistencia acá: ${publicUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const summary = guestsData.summary;
  const guestsList = guestsData.guests || [];

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h1 className="h3 mb-1">Panel de Anfitriones y Gestión</h1>
            <p className="text-muted mb-0">
              Armá borradores, activá tras el pago, controlá confirmaciones y pagos de tarjeta
            </p>
          </div>

          {invitation?.slug && (
            <div className="d-flex flex-wrap gap-2">
              {invitation.status === "active" && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={shareOnWhatsApp}
                >
                  Compartir por WhatsApp
                </button>
              )}
              {invitation.status !== "active" && hasAdminToken && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={activating}
                  onClick={handleActivateInvitation}
                >
                  {activating ? "Activando..." : "Activar invitación (Pago acreditado)"}
                </button>
              )}
              <Link to={`/${invitation.slug}`} className="btn btn-dark btn-sm">
                Ver invitación
              </Link>
            </div>
          )}
        </div>

        {/* Acceso por token */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <h2 className="h6 mb-0">Token de anfitrión / administrador</h2>
            <span
              className={`badge ${
                hasAdminToken ? "text-bg-success" : "text-bg-warning text-dark"
              }`}
            >
              {hasAdminToken ? "Token activo en sesión" : "Sin token"}
            </span>
          </div>
          <p className="text-muted small mb-3">
            Necesario para ver invitados, marcar pagos de tarjeta, descargar el CSV o editar.
          </p>

          <form className="row g-2 align-items-center" onSubmit={handleSaveAdminToken}>
            <div className="col-sm-7 col-md-8">
              <input
                type="password"
                className="form-control"
                placeholder="Ingresá hostToken o ADMIN_TOKEN..."
                value={adminTokenInput}
                onChange={(e) => setAdminTokenInput(e.target.value)}
              />
            </div>
            <div className="col-sm-5 col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-fill">
                Guardar token
              </button>
              {hasAdminToken && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClearAdminToken}
                >
                  Salir
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bandeja de solicitudes e invitaciones (Admin) */}
        {ordersList.length > 0 && (
          <div className="card border-0 shadow-sm p-4 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h2 className="h6 mb-0">
                  Solicitudes e invitaciones ({ordersList.length})
                </h2>
                {loadingOrders && <small className="text-muted">Actualizando...</small>}
              </div>

              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${statusFilter === "all" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setStatusFilter("all")}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "draft" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setStatusFilter("draft")}
                >
                  Borradores
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "active" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setStatusFilter("active")}
                >
                  Activas
                </button>
              </div>
            </div>

            <div className="mb-3">
              <select
                className="form-select form-select-sm"
                value={selectedSlug || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedSlug(e.target.value);
                    loadInvitationAndGuests(e.target.value, savedToken);
                  }
                }}
              >
                <option value="">-- Seleccionar solicitud o invitación --</option>
                {ordersList.map((item) => (
                  <option key={item._id || item.slug} value={item.slug}>
                    [{item.status === "active" ? "ACTIVA" : "BORRADOR"}]{" "}
                    {item.eventData?.title || item.slug} — /{item.slug}
                  </option>
                ))}
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Cliente</th>
                    <th>WhatsApp</th>
                    <th>Estado</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((item) => (
                    <tr key={item._id || item.slug}>
                      <td>
                        <div className="fw-semibold">{item.eventData?.title || item.slug}</div>
                        <small className="text-muted">/{item.slug}</small>
                      </td>
                      <td>{item.hostContact?.name || "—"}</td>
                      <td>{item.hostContact?.whatsapp || "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === "active"
                              ? "text-bg-success"
                              : "text-bg-warning text-dark"
                          }`}
                        >
                          {item.status === "active" ? "Activa" : "Borrador"}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setSelectedSlug(item.slug);
                            loadInvitationAndGuests(item.slug, savedToken);
                          }}
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buscador por slug */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <form
            className="row g-2 align-items-end"
            onSubmit={(e) => {
              e.preventDefault();
              loadInvitationAndGuests(selectedSlug, savedToken);
            }}
          >
            <div className="col-sm-8 col-md-9">
              <label className="form-label">Slug de invitación</label>
              <input
                type="text"
                className="form-control"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                placeholder="Ej. boda-ana-y-lucas"
              />
            </div>
            <div className="col-sm-4 col-md-3 d-grid">
              <button type="submit" className="btn btn-primary" disabled={loadingInv}>
                {loadingInv ? "Buscando..." : "Consultar"}
              </button>
            </div>
          </form>
        </div>

        {/* Métricas y lista de invitados */}
        {invitation && (
          <>
            <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
              <span
                className={`badge ${
                  invitation.status === "active"
                    ? "text-bg-success"
                    : "text-bg-warning text-dark"
                }`}
              >
                Estado:{" "}
                {invitation.status === "active"
                  ? "Activa (Lista para WhatsApp)"
                  : "Borrador (Vista previa)"}
              </span>
              {invitation.eventData?.cardPrice > 0 && (
                <span className="badge text-bg-light border text-dark">
                  Tarjeta de referencia: $
                  {Number(invitation.eventData.cardPrice).toLocaleString("es-AR")}
                </span>
              )}
            </div>

            {summary && (
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm p-3 text-center">
                    <div className="small text-muted">Total personas</div>
                    <div className="fs-3 fw-bold text-primary">{summary.totalPeople ?? 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm p-3 text-center">
                    <div className="small text-muted">Tarjetas pagadas</div>
                    <div className="fs-3 fw-bold text-success">{summary.cardsPaid ?? 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm p-3 text-center">
                    <div className="small text-muted">Pendientes / Señadas</div>
                    <div className="fs-3 fw-bold text-warning-emphasis">
                      {(summary.cardsPending ?? 0) + (summary.cardsPartial ?? 0)}
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm p-3 text-center">
                    <div className="small text-muted">Total cobrado</div>
                    <div className="fs-3 fw-bold text-dark">
                      ${Number(summary.totalCollected || 0).toLocaleString("es-AR")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm p-4 mb-5">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 mb-0">
                  Invitados y pagos de tarjeta — {invitation.eventData?.title || invitation.slug}
                </h2>
                {hasAdminToken && (
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    disabled={exportingCsv}
                    onClick={handleDownloadCsv}
                  >
                    {exportingCsv ? "Generando CSV..." : "Descargar planilla (Excel / CSV)"}
                  </button>
                )}
              </div>

              {!hasAdminToken ? (
                <p className="text-muted mb-0">
                  Ingresá tu token arriba para ver la lista de invitados, registrar pagos de tarjeta
                  y descargar el CSV.
                </p>
              ) : guestsList.length === 0 ? (
                <p className="text-muted mb-0">Todavía no hay confirmaciones registradas.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Invitado</th>
                        <th>Asistencia</th>
                        <th>Personas</th>
                        <th>Estado tarjeta</th>
                        <th>Abonado ($)</th>
                        <th>Notas</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestsList.map((g) => (
                        <GuestPaymentRow
                          key={g._id}
                          guest={g}
                          slug={invitation.slug}
                          token={savedToken}
                          onSaved={() => loadGuestsOnly(invitation.slug, savedToken)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Editar invitación */}
            <div className="card border-0 shadow-sm p-4 mb-5">
              <h2 className="h5 mb-3">Editar invitación ({invitation.slug})</h2>
              <form onSubmit={handleUpdateInvitation}>
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Plantilla</label>
                    <select
                      className="form-select"
                      value={editTemplateId}
                      onChange={(e) => setEditTemplateId(e.target.value)}
                    >
                      <option value="Vintage">Vintage</option>
                      <option value="Minimalist">Minimalist</option>
                      <option value="Classic">Classic</option>
                      <option value="Festive">Festive</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="expired">expired</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Valor tarjeta ($)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={editCardPrice}
                      onChange={(e) => setEditCardPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Título del evento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Anfitriones (separados por &)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editHostsText}
                      onChange={(e) => setEditHostsText(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Fecha del evento</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={editEventDate}
                      onChange={(e) => setEditEventDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Dress Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDressCode}
                      onChange={(e) => setEditDressCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Mensaje de bienvenida</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    value={editWelcomeMessage}
                    onChange={(e) => setEditWelcomeMessage(e.target.value)}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">URL de música</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editMusicUrl}
                      onChange={(e) => setEditMusicUrl(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Galería (una URL por línea)</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      value={editGalleryText}
                      onChange={(e) => setEditGalleryText(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border rounded p-3 mb-3 bg-light">
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="giftEnabledSwitch"
                      checked={editGiftEnabled}
                      onChange={(e) => setEditGiftEnabled(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="giftEnabledSwitch">
                      Mostrar Mesa de regalos
                    </label>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Alias"
                        value={editGiftAlias}
                        onChange={(e) => setEditGiftAlias(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="CBU / CVU"
                        value={editGiftCbu}
                        onChange={(e) => setEditGiftCbu(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Mensaje de regalo"
                        value={editGiftMessage}
                        onChange={(e) => setEditGiftMessage(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Ubicaciones (JSON)</label>
                  <textarea
                    rows="4"
                    className="form-control font-monospace small"
                    value={editLocationsJson}
                    onChange={(e) => setEditLocationsJson(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-dark" disabled={savingEdit}>
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Crear borrador */}
        <div className="card border-0 shadow-sm p-4">
          <h2 className="h5 mb-3">Crear nuevo borrador (antes del pago)</h2>
          <form onSubmit={handleCreateDraft}>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Slug *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. boda-camila-y-tomas"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Plantilla</label>
                <select
                  className="form-select"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="Vintage">Vintage</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Classic">Classic</option>
                  <option value="Festive">Festive</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Tipo de evento</label>
                <select
                  className="form-select"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="wedding">Casamiento</option>
                  <option value="quinceanera">15 Años</option>
                  <option value="communion">Comunión / Bautismo</option>
                  <option value="birthday">Cumpleaños / Otro</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Título del evento *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Boda Camila & Tomás"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Anfitriones (separados por &)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Camila & Tomás"
                  value={hostsText}
                  onChange={(e) => setHostsText(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha y hora *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Dress Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Valor tarjeta ($)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={cardPrice}
                  onChange={(e) => setCardPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Nombre de contacto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Camila"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">WhatsApp de contacto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 5493510000000"
                  value={hostWhatsapp}
                  onChange={(e) => setHostWhatsapp(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-dark" disabled={creating}>
              {creating ? "Creando borrador..." : "Crear borrador y preview"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}