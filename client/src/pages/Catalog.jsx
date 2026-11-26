import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CATALOG_MODELS,
  EVENT_CATEGORIES,
  buildWhatsAppOrderUrl,
} from "../data/catalogModels";

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredModels =
    selectedCategory === "all"
      ? CATALOG_MODELS
      : CATALOG_MODELS.filter((m) => m.eventType === selectedCategory);

  return (
    <div style={{ backgroundColor: "#faf9f6", minHeight: "100vh" }}>
      <nav className="navbar navbar-expand-lg bg-white border-bottom py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            Invitaciones Digitales
          </Link>
          <div className="d-flex gap-2">
            <Link to="/solicitar" className="btn btn-dark btn-sm">
              Hacer mi pedido
            </Link>
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
              Panel
            </Link>
          </div>
        </div>
      </nav>

      <header className="py-5 bg-white border-bottom">
        <div className="container text-center" style={{ maxWidth: "760px" }}>
          <span className="badge text-bg-light border text-dark mb-3 px-3 py-2">
            Casamientos • 15 Años • Comuniones • Bautismos • Cumpleaños
          </span>
          <h1 className="display-6 fw-bold mb-3">
            Tu invitación web lista para compartir por WhatsApp
          </h1>
          <p className="lead text-muted mb-4">
            Elegí el diseño que más te guste, enviános tus datos por formulario o
            WhatsApp y revisá una demo personalizada antes de abonar.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <a href="#modelos" className="btn btn-dark px-4">
              Ver modelos
            </a>
            <a
              href={buildWhatsAppOrderUrl({
                modelName: "A definir",
                categoryLabel: "Consulta general",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success px-4"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </header>

      <section className="py-4 border-bottom bg-light">
        <div className="container">
          <div className="row g-3 text-center">
            <div className="col-md-4">
              <div className="p-3 bg-white rounded border h-100">
                <div className="fw-bold mb-1">1. Elegí tu plantilla</div>
                <p className="small text-muted mb-0">
                  Probá las demos interactivas y seleccioná el estilo de tu
                  evento.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-white rounded border h-100">
                <div className="fw-bold mb-1">2. Envianos tus datos</div>
                <p className="small text-muted mb-0">
                  Completá el formulario con fotos, música y lugar, o pedilo
                  directo por WhatsApp.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-white rounded border h-100">
                <div className="fw-bold mb-1">3. Revisá tu demo y compartí</div>
                <p className="small text-muted mb-0">
                  Te mostramos cómo queda tu tarjeta, abonás y recibís el link
                  final + panel de invitados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main id="modelos" className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <h2 className="h4 mb-0">Modelos disponibles</h2>

          <div className="d-flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn btn-sm ${
                  selectedCategory === cat.id ? "btn-dark" : "btn-outline-dark"
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row g-4">
          {filteredModels.map((model) => (
            <div key={model.id} className="col-md-6 col-lg-3">
              <div className="card h-100 border shadow-sm">
                <div
                  className="p-4 text-center border-bottom d-flex flex-column justify-content-center"
                  style={{
                    backgroundColor: model.bgPreview,
                    minHeight: "170px",
                    color: model.accentColor,
                  }}
                >
                  <span className="small text-uppercase fw-semibold mb-1">
                    {model.categoryLabel}
                  </span>
                  <h3 className="h5 fw-bold mb-1">{model.name}</h3>
                  <span className="small opacity-75">
                    Plantilla {model.templateId}
                  </span>
                </div>

                <div className="card-body d-flex flex-column">
                  <p className="small text-muted mb-3">{model.tagline}</p>

                  <ul className="list-unstyled small mb-4">
                    {model.features.map((feat) => (
                      <li key={feat} className="mb-1">
                        ✓ {feat}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto d-grid gap-2">
                    <Link
                      to={`/${model.demoSlug}`}
                      className="btn btn-outline-dark btn-sm"
                    >
                      Ver demo en vivo
                    </Link>
                    <Link
                      to={`/solicitar?modelo=${encodeURIComponent(
                        model.templateId
                      )}&evento=${encodeURIComponent(model.eventType)}`}
                      className="btn btn-dark btn-sm"
                    >
                      Solicitar este modelo
                    </Link>
                    <a
                      href={buildWhatsAppOrderUrl({
                        modelName: model.name,
                        categoryLabel: model.categoryLabel,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-success btn-sm"
                    >
                      Pedir por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}