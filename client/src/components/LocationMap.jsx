function normalizeLocations(locations) {
  if (!locations) return [];
  if (Array.isArray(locations)) {
    return locations.filter((item) => item && (item.name || item.address || item.title));
  }
  if (typeof locations === "object") {
    return Object.entries(locations)
      .filter(([, val]) => val && typeof val === "object" && (val.name || val.address || val.title))
      .map(([key, val]) => ({
        key,
        title: val.title || (key === "ceremony" ? "Ceremonia" : key === "party" ? "Fiesta" : key),
        ...val,
      }));
  }
  return [];
}

export default function LocationMap({ locations, theme }) {
  const items = normalizeLocations(locations);
  if (items.length === 0) return null;

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <h2 className="h5 mb-3">Ubicaciones</h2>
      <div className="row g-3">
        {items.map((loc, idx) => {
          const query = encodeURIComponent(loc.address || loc.name || "");
          const mapLink =
            loc.mapUrl || (query ? `https://www.google.com/maps/search/?api=1&query=${query}` : null);

          return (
            <div className="col-md-6" key={loc.key || loc._id || idx}>
              <div className="border p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fw-semibold">{loc.title || loc.name || `Lugar ${idx + 1}`}</div>
                  {loc.name && loc.title && <div className="small">{loc.name}</div>}
                  {loc.address && <div className="small text-muted mt-1">{loc.address}</div>}
                  {loc.time && <div className="small text-muted mt-1">Horario: {loc.time}</div>}
                </div>
                {mapLink && (
                  <div className="mt-3">
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noreferrer"
                      className={theme.btnClass}
                    >
                      Ver en mapa
                    </a>
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