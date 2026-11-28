import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { TEMPLATE_OPTIONS } from "../data/templateThemes";
import {
  getInvitationBySlug,
  createInvitation,
  activateInvitation,
  listInvitations,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from "../services/api";

export default function Dashboard() {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = (searchParams.get("token") || "").trim();
  const actionRef = useRef(null);

  const [selectedSlug, setSelectedSlug] = useState(routeSlug || "");
  const [invitation, setInvitation] = useState(null);
  const [loadingInv, setLoadingInv] = useState(false);
  const [activating, setActivating] = useState(false);

  const [savedToken, setSavedToken] = useState(() => queryToken || getAdminToken());
  const [adminTokenInput, setAdminTokenInput] = useState(
    () => queryToken || getAdminToken()
  );
  const hasAdminToken = Boolean(savedToken);

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

  useEffect(() => {
    if (queryToken) {
      setAdminToken(queryToken);
      setSavedToken(queryToken);
      setAdminTokenInput(queryToken);
    }
  }, [queryToken]);

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

  async function selectInvitation(targetSlug, shouldScroll = false) {
    const cleanSlug = String(targetSlug || "").trim().toLowerCase();
    if (!cleanSlug) return;
    setSelectedSlug(cleanSlug);
    setLoadingInv(true);
    try {
      const inv = await getInvitationBySlug(cleanSlug);
      setInvitation(inv);
      if (shouldScroll) {
        actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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
    if (routeSlug) {
      selectInvitation(routeSlug, false);
    }
  }, [routeSlug]);

  function handleSaveAdminToken(e) {
    e.preventDefault();
    const clean = adminTokenInput.trim();
    if (!clean) return;
    setAdminToken(clean);
    setSavedToken(clean);
    fetchAdminOrders(clean, statusFilter);
    Swal.fire({
      icon: "success",
      title: "Token guardado",
      text: "Bandeja de administración habilitada.",
      timer: 1200,
      showConfirmButton: false,
    });
  }

  function handleClearAdminToken() {
    clearAdminToken();
    setSavedToken("");
    setAdminTokenInput("");
    setOrdersList([]);
    setInvitation(null);
  }

  async function handleCreateDraft(e) {
    e.preventDefault();
    if (!slug.trim() || !title.trim() || !eventDate) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Completá slug, título y fecha del evento.",
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
      setInvitation(createdInv);
      setSelectedSlug(createdInv.slug);

      const hostLink = createdInv.hostToken
        ? `${window.location.origin}/panel/${createdInv.slug}?token=${createdInv.hostToken}`
        : `${window.location.origin}/panel/${createdInv.slug}`;

      Swal.fire({
        icon: "success",
        title: "Borrador creado",
        html: `
          <p class="mb-2">Demo listo para revisar antes de cobrar.</p>
          <p class="small text-muted mb-0">Link del anfitrión: <code>${hostLink}</code></p>
        `,
      });

      setSlug("");
      setTitle("");
      setHostsText("");
      setEventDate("");
      setHostName("");
      setHostWhatsapp("");
      await fetchAdminOrders(savedToken, statusFilter);
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

  async function handleActivate(targetSlug = invitation?.slug) {
    if (!targetSlug) return;
    setActivating(true);
    try {
      const res = await activateInvitation(targetSlug);
      const updated = res.invitation || { ...invitation, status: "active" };
      if (invitation?.slug === targetSlug) {
        setInvitation(updated);
      }
      await fetchAdminOrders(savedToken, statusFilter);
      Swal.fire({
        icon: "success",
        title: "Invitación activada",
        text: `/${targetSlug} ya está activa para compartir.`,
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

  function copyHostPanelLink(inv) {
    if (!inv?.slug) return;
    const tokenPart = inv.hostToken ? `?token=${inv.hostToken}` : "";
    const url = `${window.location.origin}/panel/${inv.slug}${tokenPart}`;
    navigator.clipboard?.writeText(url);
    Swal.fire({
      icon: "success",
      title: "Link del anfitrión copiado",
      text: url,
      timer: 1800,
      showConfirmButton: false,
    });
  }

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h1 className="h3 mb-1">Administración de Pedidos e Invitaciones</h1>
            <p className="text-muted mb-0">
              Revisá solicitudes, creá borradores, activá tras el pago y compartí el panel al cliente
            </p>
          </div>
          <Link to="/" className="btn btn-outline-dark btn-sm">
            Ver catálogo
          </Link>
        </div>

        {/* Token de administrador */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <h2 className="h6 mb-0">Acceso de administrador</h2>
            <span
              className={`badge ${
                hasAdminToken ? "text-bg-success" : "text-bg-warning text-dark"
              }`}
            >
              {hasAdminToken ? "ADMIN_TOKEN activo" : "Sin clave"}
            </span>
          </div>
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

        {/* Bandeja de pedidos */}
        {hasAdminToken && (
          <div className="card border-0 shadow-sm p-4 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h2 className="h5 mb-0">
                  Bandeja de solicitudes ({ordersList.length})
                </h2>
                {loadingOrders && (
                  <small className="text-muted">Actualizando...</small>
                )}
              </div>

              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${
                    statusFilter === "all" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setStatusFilter("all")}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`btn ${
                    statusFilter === "draft" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setStatusFilter("draft")}
                >
                  Borradores
                </button>
                <button
                  type="button"
                  className={`btn ${
                    statusFilter === "active" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setStatusFilter("active")}
                >
                  Activas
                </button>
              </div>
            </div>

            {ordersList.length === 0 ? (
              <p className="text-muted mb-0">
                No hay solicitudes para mostrar en este filtro.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Cliente</th>
                      <th>WhatsApp</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.map((item) => (
                      <tr key={item._id || item.slug}>
                        <td>
                          <div className="fw-semibold">
                            {item.eventData?.title || item.slug}
                          </div>
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
                          <div className="d-inline-flex flex-wrap gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark"
                              onClick={() => selectInvitation(item.slug, true)}
                            >
                              Ver ficha
                            </button>
                            <Link
                              to={`/panel/${item.slug}${
                                item.hostToken ? `?token=${item.hostToken}` : ""
                              }`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Panel cliente
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ficha rápida del pedido seleccionado */}
        {invitation && (
          <div ref={actionRef} className="card border-0 shadow-sm p-4 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span
                  className={`badge me-2 ${
                    invitation.status === "active"
                      ? "text-bg-success"
                      : "text-bg-warning text-dark"
                  }`}
                >
                  {invitation.status === "active" ? "Activa" : "Borrador"}
                </span>
                <strong>{invitation.eventData?.title || invitation.slug}</strong>{" "}
                <span className="text-muted small">(/{invitation.slug})</span>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {invitation.status !== "active" && hasAdminToken && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={activating}
                    onClick={() => handleActivate(invitation.slug)}
                  >
                    {activating ? "Activando..." : "Activar tras pago"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => copyHostPanelLink(invitation)}
                >
                  Copiar link anfitrión
                </button>
                <Link to={`/${invitation.slug}`} className="btn btn-dark btn-sm">
                  Abrir demo / invitación
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Crear borrador rápido */}
        <div className="card border-0 shadow-sm p-4">
          <h2 className="h5 mb-3">Crear borrador de prueba o cliente</h2>
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
                  {TEMPLATE_OPTIONS.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.label}
                    </option>
                  ))}
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
                <label className="form-label">Nombre del cliente</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Camila"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">WhatsApp del cliente</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 5493510000000"
                  value={hostWhatsapp}
                  onChange={(e) => setHostWhatsapp(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-dark"
              disabled={creating || loadingInv}
            >
              {creating ? "Creando borrador..." : "Crear borrador"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}