export const TEMPLATES = {
  minimalist: {
    id: "Minimalist",
    label: "Minimalist",
    pageStyle: {
      backgroundColor: "#faf9f6",
      color: "#1f2933",
      minHeight: "100vh",
    },
    cardClass: "card border shadow-none rounded-0 p-4 p-md-5 bg-white",
    badgeClass: "badge rounded-0 text-bg-light border text-dark",
    btnClass: "btn btn-dark rounded-0 px-4",
  },
  classic: {
    id: "Classic",
    label: "Classic",
    pageStyle: {
      backgroundColor: "#f4efe6",
      color: "#2c241b",
      minHeight: "100vh",
    },
    cardClass: "card shadow-sm rounded-3 p-4 p-md-5 border-0 bg-white",
    badgeClass: "badge rounded-pill text-bg-secondary",
    btnClass: "btn btn-secondary px-4",
  },
  festive: {
    id: "Festive",
    label: "Festive",
    pageStyle: {
      backgroundColor: "#fff5f7",
      color: "#2b192e",
      minHeight: "100vh",
    },
    cardClass: "card shadow rounded-4 p-4 p-md-5 border-0 bg-white",
    badgeClass: "badge rounded-pill text-bg-danger",
    btnClass: "btn btn-danger px-4",
  },
  vintage: {
    id: "Vintage",
    label: "Vintage",
    pageStyle: {
      backgroundColor: "#efe7d6",
      color: "#3b2d1f",
      minHeight: "100vh",
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    cardClass:
      "card rounded-1 p-4 p-md-5 bg-white border border-warning-subtle shadow-sm",
    badgeClass:
      "badge rounded-1 bg-warning-subtle text-dark border border-warning",
    btnClass: "btn btn-outline-dark rounded-1 px-4",
  },
  botanical: {
    id: "Botanical",
    label: "Botanical",
    pageStyle: {
      backgroundColor: "#eff5f0",
      color: "#1f3526",
      minHeight: "100vh",
    },
    cardClass:
      "card rounded-3 p-4 p-md-5 bg-white border border-success-subtle shadow-sm",
    badgeClass:
      "badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle",
    btnClass: "btn btn-success px-4",
  },
  glam: {
    id: "Glam",
    label: "Glam",
    pageStyle: {
      backgroundColor: "#18141c",
      color: "#f8f4fb",
      minHeight: "100vh",
    },
    cardClass:
      "card rounded-4 p-4 p-md-5 bg-dark text-light border border-secondary shadow",
    badgeClass: "badge rounded-pill text-bg-warning text-dark",
    btnClass: "btn btn-warning text-dark fw-semibold px-4",
  },
  celestial: {
    id: "Celestial",
    label: "Celestial",
    pageStyle: {
      backgroundColor: "#f2f7fc",
      color: "#1e3246",
      minHeight: "100vh",
    },
    cardClass:
      "card rounded-4 p-4 p-md-5 bg-white border border-info-subtle shadow-sm",
    badgeClass:
      "badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle",
    btnClass: "btn btn-primary px-4",
  },
  party: {
    id: "Party",
    label: "Party",
    pageStyle: {
      backgroundColor: "#fff8eb",
      color: "#291d0e",
      minHeight: "100vh",
    },
    cardClass: "card rounded-4 p-4 p-md-5 bg-white border-0 shadow",
    badgeClass: "badge rounded-pill text-bg-dark",
    btnClass: "btn btn-dark rounded-pill px-4",
  },
};

export const TEMPLATE_OPTIONS = Object.values(TEMPLATES);

export function getTemplateConfig(templateId) {
  const normalizedKey = String(templateId || "minimalist")
    .trim()
    .toLowerCase();
  return TEMPLATES[normalizedKey] || TEMPLATES.minimalist;
}