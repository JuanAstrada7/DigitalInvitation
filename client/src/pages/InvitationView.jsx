import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Countdown from "../components/Countdown";
import Gallery from "../components/Gallery";
import MusicPlayer from "../components/MusicPlayer";
import RsvpForm from "../components/RsvpForm";
import LocationMap from "../components/LocationMap";
import { getInvitationBySlug, API_URL } from "../services/api";

const TEMPLATES = {
  minimalist: {
    label: "Minimalist",
    pageStyle: { backgroundColor: "#faf9f6", color: "#1f2933", minHeight: "100vh" },
    cardClass: "card border shadow-none rounded-0 p-4 p-md-5 bg-white",
    badgeClass: "badge rounded-0 text-bg-light border text-dark",
    btnClass: "btn btn-dark rounded-0 px-4",
  },
  classic: {
    label: "Classic",
    pageStyle: { backgroundColor: "#f4efe6", color: "#2c241b", minHeight: "100vh" },
    cardClass: "card shadow-sm rounded-3 p-4 p-md-5 border-0 bg-white",
    badgeClass: "badge rounded-pill text-bg-secondary",
    btnClass: "btn btn-secondary px-4",
  },
  festive: {
    label: "Festive",
    pageStyle: { backgroundColor: "#fff5f7", color: "#2b192e", minHeight: "100vh" },
    cardClass: "card shadow rounded-4 p-4 p-md-5 border-0 bg-white",
    badgeClass: "badge rounded-pill text-bg-danger",
    btnClass: "btn btn-danger px-4",
  },
  vintage: {
    label: "Vintage",
    pageStyle: {
      backgroundColor: "#efe7d6",
      color: "#3b2d1f",
      minHeight: "100vh",
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    cardClass: "card rounded-1 p-4 p-md-5 bg-white border border-warning-subtle shadow-sm",
    badgeClass: "badge rounded-1 bg-warning-subtle text-dark border border-warning",
    btnClass: "btn btn-outline-dark rounded-1 px-4",
  },
};

function getTemplateConfig(templateId) {
  const normalizedKey = String(templateId || "minimalist").trim().toLowerCase();
  return TEMPLATES[normalizedKey] || TEMPLATES.minimalist;
}

function GiftRegistrySection({ giftRegistry, theme }) {
  if (!giftRegistry || !giftRegistry.enabled) return null;

  const copyValue = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      Swal.fire({
        icon: "success",
        title: "Copiado",
        text: `${label} copiado al portapapeles.`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "info",
        title: "No se pudo copiar automáticamente",
        text: `${label}: ${value}`,
      });
    }
  };

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <h2 className="h5 mb-2">Mesa de regalos</h2>
      {giftRegistry.message && <p className="text-muted small mb-3">{giftRegistry.message}</p>}
      <div className="d-flex flex-wrap gap-2">
        {giftRegistry.alias && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => copyValue(giftRegistry.alias, "Alias")}
          >
            Copiar Alias: <strong>{giftRegistry.alias}</strong>
          </button>
        )}
        {giftRegistry.cbu && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => copyValue(giftRegistry.cbu, "CBU / CVU")}
          >
            Copiar CBU: <strong>{giftRegistry.cbu}</strong>
          </button>
        )}
      </div>
    </div>
  );
}

export default function InvitationView() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvitation() {
      setLoading(true);
      setError("");
      try {
        const data = await getInvitationBySlug(slug);
        setInvitation(data);
      } catch (err) {
        const msg = err.message || "No se pudo cargar la invitación";
        setError(msg);
        Swal.fire({
          icon: "error",
          title: "Error al cargar",
          text: msg,
        });
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadInvitation();
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#faf9f6", minHeight: "100vh" }}>
        <main className="container py-5">
          <div className="card border shadow-none rounded-0 p-4 p-md-5 bg-white">
            <p className="mb-0 text-muted">Cargando invitación...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: "#faf9f6", minHeight: "100vh" }}>
        <main className="container py-5">
          <div className="card border shadow-none rounded-0 p-4 p-md-5 bg-white">
            <p className="mb-0 text-danger fw-semibold">Error: {error}</p>
          </div>
        </main>
      </div>
    );
  }

  const eventData = invitation?.eventData || {};
  const theme = getTemplateConfig(invitation?.templateId);
  const isDraft = invitation?.status === "draft";
  const isActive = invitation?.status === "active";

  const shareOnWhatsApp = () => {
    const publicUrl = `${window.location.origin}/${invitation.slug}`;
    const text = `¡Te invito a ${
      eventData.title || "nuestro evento"
    }! Mirá todos los detalles acá: ${publicUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={theme.pageStyle}>
      <main className="container py-5">
        {isDraft && (
          <div className="alert alert-warning border-warning mb-4" role="alert">
            <strong>Vista previa en borrador:</strong> esta invitación aún no fue activada.
            Completá el pago para habilitar el envío por WhatsApp y la confirmación de invitados.
          </div>
        )}

        <div className={theme.cardClass}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span className="text-muted small">Slug: {invitation.slug}</span>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className={theme.badgeClass}>
                Plantilla: {invitation.templateId || theme.label}
              </span>
              {isActive && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={shareOnWhatsApp}
                >
                  Compartir por WhatsApp
                </button>
              )}
            </div>
          </div>

          <h1 className="mt-3">{eventData.title}</h1>
          <p className="lead">
            {Array.isArray(eventData.hosts) ? eventData.hosts.join(" & ") : ""}
          </p>
          {eventData.welcomeMessage && <p className="text-muted">{eventData.welcomeMessage}</p>}
          <p className="mb-1">
            <strong>Fecha:</strong>{" "}
            {eventData.eventDate
              ? new Date(eventData.eventDate).toLocaleDateString("es-AR")
              : "Por confirmar"}
          </p>
          <p className="mb-0">
            <strong>Dress Code:</strong> {eventData.dressCode || "Elegante"}
          </p>
        </div>

        <Countdown eventDate={eventData.eventDate} theme={theme} />
        <MusicPlayer musicUrl={eventData.musicUrl} theme={theme} />
        <Gallery images={eventData.galleryImages} theme={theme} />
        <LocationMap locations={invitation.locations} theme={theme} />
        <GiftRegistrySection giftRegistry={invitation.giftRegistry} theme={theme} />

        {isActive ? (
          <RsvpForm slug={invitation.slug} apiUrl={API_URL} theme={theme} />
        ) : (
          <div className={`${theme.cardClass} mt-4`}>
            <p className="mb-0 text-muted small">
              El formulario de confirmación de asistencia (RSVP) se habilita automáticamente una vez
              que la invitación esté activa.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}