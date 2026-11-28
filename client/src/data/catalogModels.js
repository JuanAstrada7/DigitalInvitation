export const WHATSAPP_BUSINESS_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "5493510000000";

export const EVENT_CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "wedding", label: "Casamientos" },
  { id: "quinceanera", label: "15 Años" },
  { id: "communion", label: "Comunión y Bautismo" },
  { id: "birthday", label: "Cumpleaños" },
];

export const CATALOG_MODELS = [
  // --- CASAMIENTOS ---
  {
    id: "vintage-boda",
    templateId: "Vintage",
    eventType: "wedding",
    categoryLabel: "Casamiento",
    name: "Vintage Romance",
    tagline: "Tipografía clásica, tonos cálidos y estilo editorial romántico.",
    demoSlug: "prueba-boda",
    accentColor: "#8c6d46",
    bgPreview: "#efe7d6",
    features: [
      "Cuenta regresiva",
      "Música de fondo",
      "Mapa salón / iglesia",
      "Mesa de regalos",
      "RSVP",
    ],
  },
  {
    id: "minimalist-boda",
    templateId: "Minimalist",
    eventType: "wedding",
    categoryLabel: "Casamiento",
    name: "Minimalist Blanco",
    tagline: "Diseño limpio, moderno y elegante con foco en las fotos.",
    demoSlug: "prueba-boda",
    accentColor: "#1f2933",
    bgPreview: "#faf9f6",
    features: [
      "Galería de fotos",
      "Música de fondo",
      "Ubicación GPS",
      "Alias / CBU",
      "RSVP",
    ],
  },
  {
    id: "botanical-boda",
    templateId: "Botanical",
    eventType: "wedding",
    categoryLabel: "Casamiento",
    name: "Jardín Botánico",
    tagline: "Tonos verdes suaves y aire natural para bodas al aire libre.",
    demoSlug: "prueba-boda",
    accentColor: "#1f5132",
    bgPreview: "#eff5f0",
    features: [
      "Cuenta regresiva",
      "Galería de fotos",
      "Mapa ceremonia y fiesta",
      "Mesa de regalos",
      "RSVP",
    ],
  },

  // --- 15 AÑOS ---
  {
    id: "festive-quince",
    templateId: "Festive",
    eventType: "quinceanera",
    categoryLabel: "15 Años",
    name: "Festive Rose",
    tagline: "Vibrante y moderno, ideal para noches de 15 y fiestas.",
    demoSlug: "prueba-boda",
    accentColor: "#be185d",
    bgPreview: "#fff5f7",
    features: [
      "Cuenta regresiva",
      "Música / sugerencias",
      "Dress code",
      "Galería",
      "RSVP",
    ],
  },
  {
    id: "glam-quince",
    templateId: "Glam",
    eventType: "quinceanera",
    categoryLabel: "15 Años",
    name: "Glam Noche",
    tagline: "Estilo nocturno elegante con acentos dorados para una gran fiesta.",
    demoSlug: "prueba-boda",
    accentColor: "#d97706",
    bgPreview: "#18141c",
    features: [
      "Cuenta regresiva",
      "Música de fondo",
      "Galería",
      "Mapa del salón",
      "RSVP",
    ],
  },

  // --- COMUNIÓN Y BAUTISMO ---
  {
    id: "classic-comunion",
    templateId: "Classic",
    eventType: "communion",
    categoryLabel: "Comunión / Bautismo",
    name: "Classic Arena",
    tagline: "Suave, cálido y delicado para celebraciones familiares.",
    demoSlug: "prueba-boda",
    accentColor: "#5c4d3c",
    bgPreview: "#f4efe6",
    features: [
      "Iglesia y festejo",
      "Confirmación familiar",
      "Restricciones alimentarias",
      "Mapa",
    ],
  },
  {
    id: "celestial-comunion",
    templateId: "Celestial",
    eventType: "communion",
    categoryLabel: "Comunión / Bautismo",
    name: "Celestial Azul",
    tagline: "Sereno y luminoso en tonos celestes para bautismos y comuniones.",
    demoSlug: "prueba-boda",
    accentColor: "#1d4ed8",
    bgPreview: "#f2f7fc",
    features: [
      "Iglesia y festejo",
      "Confirmación familiar",
      "Galería",
      "Mapa",
    ],
  },

  // --- CUMPLEAÑOS ---
  {
    id: "party-cumple",
    templateId: "Party",
    eventType: "birthday",
    categoryLabel: "Cumpleaños",
    name: "Party Gold",
    tagline: "Fresco, ágil y festivo para cumpleaños de todas las edades.",
    demoSlug: "prueba-boda",
    accentColor: "#291d0e",
    bgPreview: "#fff8eb",
    features: [
      "Cuenta regresiva",
      "Sugerencia de temas",
      "Ubicación",
      "RSVP",
    ],
  },
  {
    id: "minimalist-cumple",
    templateId: "Minimalist",
    eventType: "birthday",
    categoryLabel: "Cumpleaños",
    name: "Minimalist Clean",
    tagline: "Simple y directo, ideal para encuentros o cenas especiales.",
    demoSlug: "prueba-boda",
    accentColor: "#1f2933",
    bgPreview: "#faf9f6",
    features: [
      "Ubicación GPS",
      "Galería",
      "Confirmación rápida",
    ],
  },
];

export function buildWhatsAppOrderUrl({
  modelName,
  categoryLabel,
  customMessage = "",
}) {
  const baseText = customMessage
    ? customMessage
    : `¡Hola! Me interesa pedir una invitación digital.\n• Modelo: ${modelName}\n• Evento: ${categoryLabel}\n¿Me contás cómo seguimos?`;
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(
    baseText
  )}`;
}