import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { createInvitation } from "../services/api";
import { CATALOG_MODELS, buildWhatsAppOrderUrl } from "../data/catalogModels";

function generateSlugFromTitle(title) {
  const base = String(title || "evento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 35);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || "invitacion"}-${suffix}`;
}

export default function RequestForm() {
  const [searchParams] = useSearchParams();
  const initialTemplate = searchParams.get("modelo") || "Vintage";
  const initialEvent = searchParams.get("evento") || "wedding";

  const [templateId, setTemplateId] = useState(initialTemplate);
  const [eventType, setEventType] = useState(initialEvent);
  const [title, setTitle] = useState("");
  const [hostsText, setHostsText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [dressCode, setDressCode] = useState("Elegante");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const [ceremonyPlace, setCeremonyPlace] = useState("");
  const [partyPlace, setPartyPlace] = useState("");

  const [musicReference, setMusicReference] = useState("");
  const [photosFolderOrUrls, setPhotosFolderOrUrls] = useState("");
  const [giftAlias, setGiftAlias] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const [hostName, setHostName] = useState("");
  const [hostWhatsapp, setHostWhatsapp] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const selectedModel =
    CATALOG_MODELS.find((m) => m.templateId === templateId) || CATALOG_MODELS[0];

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim() || !eventDate || !hostName.trim() || !hostWhatsapp.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Completá los datos principales",
        text: "Necesitamos el título del evento, la fecha, tu nombre y tu WhatsApp para enviarte el demo.",
      });
      return;
    }

    const generatedSlug = generateSlugFromTitle(title);

    const galleryImages = photosFolderOrUrls
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^https?:\/\//i.test(line));

    const extraNotes = [
      welcomeMessage.trim(),
      musicReference.trim() ? `Música solicitada: ${musicReference.trim()}` : "",
      photosFolderOrUrls.trim() && galleryImages.length === 0
        ? `Fotos / Drive: ${photosFolderOrUrls.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const locations = [];
    if (ceremonyPlace.trim()) {
      locations.push({ title: "Ceremonia", address: ceremonyPlace.trim() });
    }
    if (partyPlace.trim()) {
      locations.push({ title: "Fiesta", address: partyPlace.trim() });
    }

    const payload = {
      slug: generatedSlug,
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
        welcomeMessage: extraNotes,
        musicUrl: /^https?:\/\/.*\.mp3$/i.test(musicReference.trim())
          ? musicReference.trim()
          : "",
        galleryImages,
      },
      locations,
      giftRegistry: {
        enabled: Boolean(giftAlias.trim() || giftMessage.trim()),
        alias: giftAlias.trim(),
        message: giftMessage.trim(),
      },
    };

    setSubmitting(true);
    try {
      const res = await createInvitation(payload);
      const inv = res.invitation || res;
      setCreatedOrder(inv);

      Swal.fire({
        icon: "success",
        title: "¡Solicitud enviada!",
        text: "Ya registramos tu pedido. Podés abrir WhatsApp para avisarnos o ver tu vista previa inicial.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo registrar el pedido",
        text: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappSummaryText = createdOrder
    ? `¡Hola! Acabo de enviar mi solicitud de invitación digital.\n• Código: ${
        createdOrder.slug
      }\n• Modelo: ${templateId}\n• Evento: ${title}\n• Nombre: ${hostName}\nQuedo a la espera del demo para revisarlo.`
    : `¡Hola! Quiero pedir el modelo *${selectedModel.name}* (${templateId}).\n• Evento: ${
        title || "A definir"
      }\n• Fecha: ${eventDate || "A definir"}\n• Mi nombre: ${hostName || ""}`;

  return (
    <div style={{ backgroundColor: "#faf9f6", minHeight: "100vh" }}>
      <nav className="navbar bg-white border-bottom py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            ← Volver al catálogo
          </Link>
          <a
            href={buildWhatsAppOrderUrl({
              modelName: selectedModel.name,
              categoryLabel: selectedModel.categoryLabel,
              customMessage: whatsappSummaryText,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-sm"
          >
            Pedir directo por WhatsApp
          </a>
        </div>
      </nav>

      <main className="container py-5" style={{ maxWidth: "820px" }}>
        {createdOrder ? (
          <div className="card border shadow-sm p-4 p-md-5 bg-white text-center">
            <h1 className="h3 mb-2">¡Recibimos los datos de tu invitación!</h1>
            <p className="text-muted mb-4">
              Armamos tu borrador inicial con el código{" "}
              <strong>{createdOrder.slug}</strong>. Envianos el aviso por WhatsApp
              así terminamos de personalizar las fotos y la música y te pasamos el
              demo final antes del pago.
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-2">
              <a
                href={buildWhatsAppOrderUrl({
                  modelName: selectedModel.name,
                  categoryLabel: selectedModel.categoryLabel,
                  customMessage: whatsappSummaryText,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success px-4"
              >
                Avisar por WhatsApp ahora
              </a>
              <Link
                to={`/${createdOrder.slug}`}
                className="btn btn-outline-dark px-4"
              >
                Ver borrador preliminar
              </Link>
            </div>
          </div>
        ) : (
          <div className="card border shadow-sm p-4 p-md-5 bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h1 className="h4 mb-1">Personalizá tu invitación</h1>
                <p className="text-muted small mb-0">
                  Completá lo que tengas hoy; después lo pulimos juntos en el demo
                  antes de abonar.
                </p>
              </div>
              <a
                href={buildWhatsAppOrderUrl({
                  modelName: selectedModel.name,
                  categoryLabel: selectedModel.categoryLabel,
                  customMessage: whatsappSummaryText,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-success btn-sm"
              >
                Prefiero enviarlo por WhatsApp
              </a>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Plantilla elegida</label>
                  <select
                    className="form-select"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    <option value="Vintage">Vintage Romance</option>
                    <option value="Minimalist">Minimalist Blanco</option>
                    <option value="Festive">Festive Rose</option>
                    <option value="Classic">Classic Arena</option>
                  </select>
                </div>
                <div className="col-md-6">
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
                  <label className="form-label">Título de la tarjeta *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Nos Casamos • Camila & Tomás"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Protagonistas (separados por &)
                  </label>
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
                  <label className="form-label">Fecha y hora del evento *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Código de vestimenta (Dress Code)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Elegante, Formal, Sport elegante"
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Lugar de Ceremonia / Iglesia (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre y dirección"
                    value={ceremonyPlace}
                    onChange={(e) => setCeremonyPlace(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Salón / Fiesta</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre del salón y dirección"
                    value={partyPlace}
                    onChange={(e) => setPartyPlace(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Frase o mensaje de bienvenida</label>
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Ej. Queremos compartir con vos este momento tan especial..."
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Música de fondo (nombre o link)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Perfect - Ed Sheeran o link de YouTube"
                    value={musicReference}
                    onChange={(e) => setMusicReference(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Fotos (link de Google Drive o URLs)
                  </label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Pegá el link de tu carpeta de Drive o links de fotos"
                    value={photosFolderOrUrls}
                    onChange={(e) => setPhotosFolderOrUrls(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">
                    Alias / CBU para mesa de regalos (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. boda.camila.tomas"
                    value={giftAlias}
                    onChange={(e) => setGiftAlias(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Mensaje de mesa de regalos (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Tu presencia es nuestro mejor regalo..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                </div>
              </div>

              <hr className="my-4" />
              <h2 className="h6 mb-3">
                Tus datos de contacto para enviarte el demo
              </h2>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Tu nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Camila Gómez"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tu WhatsApp *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 351 123 4567"
                    value={hostWhatsapp}
                    onChange={(e) => setHostWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-dark w-100 py-2"
                disabled={submitting}
              >
                {submitting
                  ? "Enviando solicitud..."
                  : "Enviar solicitud para armar mi demo"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}