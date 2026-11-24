import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getInvitationBySlug,
  createInvitation,
  updateInvitation,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from "../services/api";

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

export default function Dashboard() {
  const [selectedSlug, setSelectedSlug] = useState("prueba-boda");
  const [invitation, setInvitation] = useState(null);
  const [loadingInv, setLoadingInv] = useState(false);

  // Estado de autenticación básica por token de anfitrión
  const [adminTokenInput, setAdminTokenInput] = useState(() => getAdminToken());
  const [hasAdminToken, setHasAdminToken] = useState(() => Boolean(getAdminToken()));

  // Estado para crear nueva invitación
  const [slug, setSlug] = useState("");
  const [templateId, setTemplateId] = useState("Minimalist");
  const [title, setTitle] = useState("");
  const [hostsText, setHostsText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [dressCode, setDressCode] = useState("Elegante");
  const [creating, setCreating] = useState(false);

  // Estado para editar invitación existente
  const [editTemplateId, setEditTemplateId] = useState("Minimalist");
  const [editStatus, setEditStatus] = useState("active");
  const [editTitle, setEditTitle] = useState("");
  const [editHostsText, setEditHostsText] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editDressCode, setEditDressCode] = useState("");
  const [editWelcomeMessage, setEditWelcomeMessage] = useState("");
  const [editMusicUrl, setEditMusicUrl] = useState("");
  const [editGalleryText, setEditGalleryText] = useState("");
  const [editGiftEnabled, setEditGiftEnabled] = useState(false);
  const [editGiftMessage, setEditGiftMessage] = useState("");
  const [editGiftAlias, setEditGiftAlias] = useState("");
  const [editGiftCbu, setEditGiftCbu] = useState("");
  const [editLocationsJson, setEditLocationsJson] = useState("[]");
  const [savingEdit, setSavingEdit] = useState(false);

  function hydrateEditForm(inv) {
    if (!inv) return;
    const ev = inv.eventData || {};
    const gift = inv.giftRegistry || {};

    setEditTemplateId(inv.templateId || "Minimalist");
    setEditStatus(inv.status || "active");
    setEditTitle(ev.title || "");
    setEditHostsText(Array.isArray(ev.hosts) ? ev.hosts.join(" & ") : "");
    setEditEventDate(toDatetimeLocalValue(ev.eventDate));
    setEditDressCode(ev.dressCode || "");
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

  function handleSaveAdminToken(e) {
    e.preventDefault();
    const cleanToken = adminTokenInput.trim();
    if (!cleanToken) {
      Swal.fire({
        icon: "warning",
        title: "Clave vacía",
        text: "Ingresá la clave de anfitrión (ADMIN_TOKEN) para guardar.",
      });
      return;
    }

    setAdminToken(cleanToken);
    setAdminTokenInput(cleanToken);
    setHasAdminToken(true);

    Swal.fire({
      icon: "success",
      title: "Clave guardada",
      text: "Se enviará automáticamente al crear o editar invitaciones.",
      timer: 1400,
      showConfirmButton: false,
    });
  }

  function handleClearAdminToken() {
    clearAdminToken();
    setAdminTokenInput("");
    setHasAdminToken(false);

    Swal.fire({
      icon: "info",
      title: "Sesión cerrada",
      text: "Se eliminó la clave de anfitrión de esta sesión.",
      timer: 1400,
      showConfirmButton: false,
    });
  }

  async function loadInvitationRsvps(targetSlug) {
    const cleanSlug = String(targetSlug || "").trim().toLowerCase();
    if (!cleanSlug) return;

    setLoadingInv(true);
    try {
      const data = await getInvitationBySlug(cleanSlug);
      setInvitation(data);
      hydrateEditForm(data);
    } catch (err) {
      setInvitation(null);
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
    loadInvitationRsvps(selectedSlug);
  }, []);

  async function handleCreateInvitation(e) {
    e.preventDefault();

    if (!slug.trim() || !title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Completá al menos el slug y el título del evento.",
      });
      return;
    }

    const payload = {
      slug: slug.trim().toLowerCase(),
      templateId,
      status: "active",
      eventData: {
        title: title.trim(),
        hosts: hostsText
          .split("&")
          .map((h) => h.trim())
          .filter(Boolean),
        eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
        dressCode: dressCode.trim() || "Elegante",
      },
    };

    setCreating(true);
    try {
      const data = await createInvitation(payload);

      Swal.fire({
        icon: "success",
        title: "¡Invitación creada!",
        text: `Ya podés verla en /${data.slug}`,
      });

      setSelectedSlug(data.slug);
      setInvitation(data);
      hydrateEditForm(data);
      setSlug("");
      setTitle("");
      setHostsText("");
      setEventDate("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo crear",
        text: err.message,
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateInvitation(e) {
    e.preventDefault();
    if (!invitation?.slug) return;

    let parsedLocations = [];
    try {
      const raw = editLocationsJson.trim() || "[]";
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("El campo Ubicaciones debe ser un arreglo JSON ([]).");
      }
      parsedLocations = parsed;
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
        eventDate: editEventDate ? new Date(editEventDate).toISOString() : null,
        dressCode: editDressCode.trim(),
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
      const data = await updateInvitation(invitation.slug, payload);

      setInvitation(data);
      hydrateEditForm(data);

      Swal.fire({
        icon: "success",
        title: "Invitación actualizada",
        text: `Los cambios en /${data.slug} ya están guardados.`,
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

  const rsvps = Array.isArray(invitation?.rsvps) ? invitation.rsvps : [];
  const attendingList = rsvps.filter((r) => r.attending);
  const declinedList = rsvps.filter((r) => !r.attending);
  const totalGuests = attendingList.reduce((acc, r) => acc + (Number(r.guestsCount) || 0), 0);

  const copyPublicLink = async (targetSlug) => {
    const url = `${window.location.origin}/${targetSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      Swal.fire({
        icon: "success",
        title: "Link copiado",
        text: url,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "info",
        title: "Enlace público",
        text: url,
      });
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h1 className="h3 mb-1">Panel de Anfitriones</h1>
            <p className="text-muted mb-0">
              Revisá confirmaciones RSVP, editá invitaciones y creá nuevas
            </p>
          </div>
          {invitation?.slug && (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => copyPublicLink(invitation.slug)}
              >
                Copiar link público
              </button>
              <Link to={`/${invitation.slug}`} className="btn btn-dark btn-sm">
                Ver invitación
              </Link>
            </div>
          )}
        </div>

        {/* Acceso de anfitrión (token) */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <h2 className="h6 mb-0">Acceso de anfitrión</h2>
            <span
              className={`badge ${
                hasAdminToken ? "text-bg-success" : "text-bg-warning text-dark"
              }`}
            >
              {hasAdminToken ? "Clave cargada en sesión" : "Sin clave cargada"}
            </span>
          </div>
          <p className="text-muted small mb-3">
            Necesaria para crear o editar invitaciones. Consultar invitaciones y confirmaciones
            sigue disponible.
          </p>

          <form className="row g-2 align-items-center" onSubmit={handleSaveAdminToken}>
            <div className="col-sm-7 col-md-8">
              <input
                type="password"
                className="form-control"
                placeholder="Ingresá ADMIN_TOKEN..."
                value={adminTokenInput}
                onChange={(e) => setAdminTokenInput(e.target.value)}
              />
            </div>
            <div className="col-sm-5 col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-fill">
                Guardar clave
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

        {/* Buscador por slug */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <form
            className="row g-2 align-items-end"
            onSubmit={(e) => {
              e.preventDefault();
              loadInvitationRsvps(selectedSlug);
            }}
          >
            <div className="col-sm-8 col-md-9">
              <label className="form-label">Slug de invitación a consultar</label>
              <input
                type="text"
                className="form-control"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                placeholder="Ej. prueba-boda"
              />
            </div>
            <div className="col-sm-4 col-md-3 d-grid">
              <button type="submit" className="btn btn-primary" disabled={loadingInv}>
                {loadingInv ? "Buscando..." : "Consultar"}
              </button>
            </div>
          </form>
        </div>

        {/* Métricas RSVP y Tabla */}
        {invitation && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center">
                  <div className="small text-muted">Respuestas</div>
                  <div className="fs-3 fw-bold">{rsvps.length}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center">
                  <div className="small text-muted">Confirmaron sí</div>
                  <div className="fs-3 fw-bold text-success">{attendingList.length}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center">
                  <div className="small text-muted">Total personas</div>
                  <div className="fs-3 fw-bold text-primary">{totalGuests}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center">
                  <div className="small text-muted">No asisten</div>
                  <div className="fs-3 fw-bold text-secondary">{declinedList.length}</div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm p-4 mb-5">
              <h2 className="h5 mb-3">
                Confirmaciones — {invitation.eventData?.title || invitation.slug}
              </h2>
              {rsvps.length === 0 ? (
                <p className="text-muted mb-0">Todavía no hay confirmaciones registradas.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Invitado</th>
                        <th>Asistencia</th>
                        <th>Personas</th>
                        <th>Notas / Dieta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rsvps.map((rsvp, idx) => (
                        <tr key={rsvp._id || idx}>
                          <td className="fw-semibold">{rsvp.guestName}</td>
                          <td>
                            <span
                              className={`badge ${
                                rsvp.attending ? "text-bg-success" : "text-bg-secondary"
                              }`}
                            >
                              {rsvp.attending ? "Asiste" : "No asiste"}
                            </span>
                          </td>
                          <td>{rsvp.guestsCount ?? 0}</td>
                          <td className="text-muted small">{rsvp.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Editar invitación cargada */}
            <div className="card border-0 shadow-sm p-4 mb-5">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 mb-0">Editar invitación ({invitation.slug})</h2>
                <Link to={`/${invitation.slug}`} className="btn btn-sm btn-outline-primary">
                  Abrir vista pública /{invitation.slug}
                </Link>
              </div>

              <form onSubmit={handleUpdateInvitation}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Plantilla</label>
                    <select
                      className="form-select"
                      value={editTemplateId}
                      onChange={(e) => setEditTemplateId(e.target.value)}
                    >
                      <option value="Minimalist">Minimalist</option>
                      <option value="Classic">Classic</option>
                      <option value="Festive">Festive</option>
                      <option value="Vintage">Vintage</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="draft">draft</option>
                    </select>
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
                    <label className="form-label">URL de música (audio)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://.../cancion.mp3"
                      value={editMusicUrl}
                      onChange={(e) => setEditMusicUrl(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Galería (una URL de imagen por línea)</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      placeholder={"https://.../foto1.jpg\nhttps://.../foto2.jpg"}
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
                    rows="3"
                    className="form-control font-monospace small"
                    value={editLocationsJson}
                    onChange={(e) => setEditLocationsJson(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-success" disabled={savingEdit}>
                  {savingEdit ? "Guardando cambios..." : "Guardar cambios"}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Crear nueva invitación */}
        <div className="card border-0 shadow-sm p-4">
          <h2 className="h5 mb-3">Crear nueva invitación</h2>
          <form onSubmit={handleCreateInvitation}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Slug (URL) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. cumple-ana-2027"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plantilla</label>
                <select
                  className="form-select"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="Minimalist">Minimalist</option>
                  <option value="Classic">Classic</option>
                  <option value="Festive">Festive</option>
                  <option value="Vintage">Vintage</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Título del evento *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Nuestra Boda"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Anfitriones (separados por &)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Lucía & Mario"
                  value={hostsText}
                  onChange={(e) => setHostsText(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha del evento</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Dress Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-dark" disabled={creating}>
              {creating ? "Creando..." : "Crear invitación"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}