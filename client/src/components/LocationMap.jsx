function normalizeLocations(locations) {
  if (!locations) return [];
  if (Array.isArray(locations)) {
    return locations.filter(
      (item) => item && (item.name || item.address || item.title)
    );
  }
  if (typeof locations === "object") {
    return Object.entries(locations)
      .filter(
        ([, val]) =>
          val && typeof val === "object" && (val.name || val.address || val.title)
      )
      .map(([key, val]) => ({
        key,
        title:
          val.title ||
          (key === "ceremony" ? "Ceremonia" : key === "party" ? "Fiesta" : key),
        ...val,
      }));
  }
  return [];
}

function formatGoogleCalendarDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarUrl({ loc, eventDate, eventTitle }) {
  const baseDate = eventDate ? new Date(eventDate) : null;
  if (!baseDate || Number.isNaN(baseDate.getTime())) return null;

  const start = new Date(baseDate.getTime());
  if (typeof loc.time === "string" && /^\d{1,2}:\d{2}$/.test(loc.time.trim())) {
    const [hours, minutes] = loc.time.trim().split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
  }

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const startStr = formatGoogleCalendarDate(start);
  const endStr = formatGoogleCalendarDate(end);
  if (!startStr || !endStr) return null;

  const placeLabel = loc.title || loc.name || "";
  const text = encodeURIComponent(
    [eventTitle, placeLabel].filter(Boolean).join(" — ") || "Evento"
  );
  const details = encodeURIComponent(
    [placeLabel, loc.time ? `Horario: ${loc.time}` : ""]
      .filter(Boolean)
      .join(" | ")
  );
  const location = encodeURIComponent(loc.address || loc.name || "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

export default function LocationMap({
  locations,
  theme,
  eventDate = "",
  eventTitle = "",
}) {
  const items = normalizeLocations(locations);
  if (items.length === 0) return null;

  const mutedClass = theme?.mutedClass || "text-muted";

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <h2 className="h5 mb-3">Ubicaciones</h2>
      <div className="row g-3">
        {items.map((loc, idx) => {
          const query = encodeURIComponent(
            loc.address || loc.name || loc.title || ""
          );
          const mapLink =
            loc.mapUrl ||
            (query
              ? `https://www.google.com/maps/search/?api=1&query=${query}`
              : null);
          const calendarLink = buildGoogleCalendarUrl({
            loc,
            eventDate,
            eventTitle,
          });

          return (
            <div className="col-md-6" key={loc.key || loc._id || idx}>
              <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fw-semibold">
                    {loc.title || loc.name || `Lugar ${idx + 1}`}
                  </div>
                  {loc.name && loc.title && (
                    <div className="small">{loc.name}</div>
                  )}
                  {loc.address && (
                    <div className={`small ${mutedClass} mt-1`}>
                      {loc.address}
                    </div>
                  )}
                  {loc.time && (
                    <div className={`small ${mutedClass} mt-1`}>
                      Horario: {loc.time}
                    </div>
                  )}
                </div>

                {(mapLink || calendarLink) && (
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {mapLink && (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={theme.btnClass}
                      >
                        ¿Cómo llegar?
                      </a>
                    )}
                    {calendarLink && (
                      <a
                        href={calendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center"
                      >
                        Agendar
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}