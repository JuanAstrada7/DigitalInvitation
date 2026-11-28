import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getInvitationBySlug,
  updateInvitation,
  getGuestsBySlug,
  updateGuestPayment,
  getGuestsExportUrl,
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

function normalizeLocationsForEditor(locations) {
  if (!locations || typeof locations !== "object") {
    return { ceremony: {}, party: {} };
  }
  return locations;
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
          <div className="small text-warning-emphasis">
            Dieta: {guest.dietaryRestrictions}
          </div>
        )}
        {guest.message && (
          <div className="small text-muted">"{guest.message}"</div>
        )}
      </td>
      <td>
        <span
          className={`badge ${
            guest.attending ? "text-bg-success" : "text-bg-secondary"
          }`}
        >
          {guest.attending ? "Asiste" : "No asiste"}
        </span>
      </td>
      <td>
        {guest.attending ? (
          <>
            {totalPeople}{" "}
            <span className="text-muted small">
              ({Number(guest.companions) || 0} acomp.)
            </span>
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

export default function HostPanel() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = (searchParams.get("token") || "").trim();

  const [invitation, setInvitation] = useState(null);
  const [guestsData, setGuestsData] = useState({ summary: null, guests: [] });
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);

  const [savedToken, setSavedToken] = useState(() => queryToken || getAdminToken());
  const [tokenInput, setTokenInput] = useState(() => queryToken || getAdminToken());
  const hasToken = Boolean(savedToken);

  // Edición de datos del evento por parte del anfitrión
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
  const [editLocationsJson, setEditLocationsJson] = useState(
    JSON.stringify({ ceremony: {}, party: {} }, null, 2)
  );
  const [savingEdit, setSavingEdit] = useState(false);

  function hydrateEditForm(inv) {
    if (!inv) return;
    const ev = inv.eventData || {};
    const gift = inv.giftRegistry || {};

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
      JSON.stringify(normalizeLocationsForEditor(inv.locations), null, 2)
    );
  }

  async function loadGuests(tokenToUse = savedToken) {
    if (!slug || !tokenToUse) {
      setGuestsData({ summary: null, guests: [] });
      return;
    }
    try {
      const data = await getGuestsBySlug(slug, tokenToUse);
      setGuestsData({
        summary: data.summary || null,
        guests: Array.isArray(data.guests) ? data.guests : [],
      });
    } catch {
      setGuestsData({ summary: null, guests: [] });
    }
  }

  async function loadHostData(tokenToUse = savedToken) {
    if (!slug) return;
    setLoading(true);
    try {
      const inv = await getInvitationBySlug(slug);
      setInvitation(inv);
      hydrateEditForm(inv);
      if (tokenToUse) {
        await loadGuests(tokenToUse);
      }
    } catch (err) {
      setInvitation(null);
      Swal.fire({
        icon: "error",
        title: "No se pudo cargar tu invitación",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const activeToken = queryToken || getAdminToken();
    if (queryToken) {
      setAdminToken(queryToken);
      setSavedToken(queryToken);
      setTokenInput(queryToken);
    }
    loadHostData(activeToken);
  }, [slug, queryToken]);

  function handleSaveToken(e) {
    e.preventDefault();
    const clean = tokenInput.trim();
    if (!clean) return;
    setAdminToken(clean);
    setSavedToken(clean);
    loadGuests(clean);
    Swal.fire({
      icon: "success",
      title: "Acceso habilitado",
      text: "Ya podés ver confirmaciones, registrar pagos y editar tu evento.",
      timer: 1300,
      showConfirmButton: false,
    });
  }

  function handleClearToken() {
    clearAdminToken();
    setSavedToken("");
    setTokenInput("");
    setGuestsData({ summary: null, guests: [] });
  }

  async function handleUpdateEvent(e) {
    e.preventDefault();
    if (!slug) return;

    let parsedLocations = normalizeLocationsForEditor(invitation?.locations);
    try {
      const raw = editLocationsJson.trim();
      if (raw) {
        const candidate = JSON.parse(raw);
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          throw new Error(
            'El campo Ubicaciones debe ser un objeto JSON (ej. {"ceremony": {...}, "party": {...}}).'
          );
        }
        parsedLocations = candidate;
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
      const updated = await updateInvitation(slug, payload, savedToken);
      setInvitation(updated);
      hydrateEditForm(updated);
      Swal.fire({
        icon: "success",
        title: "Cambios guardados",
        text: "Los datos de tu invitación ya están actualizados.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudieron guardar los cambios",
        text: err.message,
      });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDownloadCsv() {
    if (!slug || !savedToken) return;
    setExportingCsv(true);
    try {
      const url = getGuestsExportUrl(slug, savedToken);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "x-host-token": savedToken,
        },
      });
      if (!res.ok) throw new Error("No se pudo descargar el archivo CSV");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `invitados-${slug}.csv`;
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

  function shareOnWhatsApp() {
    if (!slug) return;
    const publicUrl = `${window.location.origin}/${slug}`;
    const text = `¡Te invito a ${
      invitation?.eventData?.title || "nuestro evento"
    }! Confirmá tu asistencia acá: ${publicUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) {
    return (
      <div className="bg-light min-vh-100 py-5">
        <div className="container text-center text-muted">
          Cargando panel del evento...
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="bg-light min-vh-100 py-5">
        <div className="container text-center">
          <h1 className="h4 mb-2">Invitación no encontrada</h1>
          <Link to="/" className="btn btn-dark btn-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const summary = guestsData.summary;
  const guestsList = guestsData.guests || [];

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <span
              className={`badge mb-2 ${
                invitation.status === "active"
                  ? "text-bg-success"
                  : "text-bg-warning text-dark"
              }`}
            >
              {invitation.status === "active"
                ? "Invitación activa"
                : "Borrador en revisión"}
            </span>
            <h1 className="h3 mb-1">
              {invitation.eventData?.title || invitation.slug}
            </h1>
            <p className="text-muted mb-0">
              Panel de anfitrión • Confirmaciones, pagos de tarjeta y datos del evento
            </p>
          </div>

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
            <Link to={`/${invitation.slug}`} className="btn btn-dark btn-sm">
              Ver invitación
            </Link>
          </div>
        </div>

        {!hasToken && (
          <div className="card border-0 shadow-sm p-4 mb-4">
            <h2 className="h6 mb-1">Ingresá tu clave de anfitrión</h2>
            <p className="text-muted small mb-3">
              Con tu clave podés ver quiénes confirmaron, registrar pagos de tarjeta
              y editar tu invitación.
            </p>
            <form className="row g-2" onSubmit={handleSaveToken}>
              <div className="col-sm-8 col-md-9">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Pegá tu clave de anfitrión..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>
              <div className="col-sm-4 col-md-3 d-grid">
                <button type="submit" className="btn btn-dark">
                  Ingresar al panel
                </button>
              </div>
            </form>
          </div>
        )}

        {hasToken && (
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-link btn-sm text-muted p-0"
              onClick={handleClearToken}
            >
              Cerrar sesión de este navegador
            </button>
          </div>
        )}

        {hasToken && summary && (
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm p-3 text-center">
                <div className="small text-muted">Total personas</div>
                <div className="fs-3 fw-bold text-primary">
                  {summary.totalPeople ?? 0}
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm p-3 text-center">
                <div className="small text-muted">Tarjetas pagadas</div>
                <div className="fs-3 fw-bold text-success">
                  {summary.cardsPaid ?? 0}
                </div>
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

        {hasToken && (
          <div className="card border-0 shadow-sm p-4 mb-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h5 mb-0">Confirmaciones y pagos de tarjeta</h2>
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                disabled={exportingCsv}
                onClick={handleDownloadCsv}
              >
                {exportingCsv ? "Generando CSV..." : "Descargar planilla (CSV)"}
              </button>
            </div>

            {guestsList.length === 0 ? (
              <p className="text-muted mb-0">
                Todavía no hay confirmaciones de invitados registradas.
              </p>
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
                        onSaved={() => loadGuests(savedToken)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {hasToken && (
          <div className="card border-0 shadow-sm p-4">
            <h2 className="h5 mb-3">Editar datos de mi invitación</h2>
            <form onSubmit={handleUpdateEvent}>
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
                  <label className="form-label">
                    Protagonistas / Anfitriones (separados por &)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editHostsText}
                    onChange={(e) => setEditHostsText(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label">Fecha y hora</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Dress Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editDressCode}
                    onChange={(e) => setEditDressCode(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Valor tarjeta de referencia ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={editCardPrice}
                    onChange={(e) => setEditCardPrice(e.target.value)}
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
                    id="hostGiftSwitch"
                    checked={editGiftEnabled}
                    onChange={(e) => setEditGiftEnabled(e.target.checked)}
                  />
                  <label
                    className="form-check-label fw-semibold"
                    htmlFor="hostGiftSwitch"
                  >
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
                <label className="form-label">Ubicaciones (JSON: ceremony / party)</label>
                <textarea
                  rows="5"
                  className="form-control font-monospace small"
                  value={editLocationsJson}
                  onChange={(e) => setEditLocationsJson(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-dark"
                disabled={savingEdit}
              >
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}