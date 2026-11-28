function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((item, idx) => {
      if (typeof item === "string" && item.trim()) {
        return { id: idx, url: item.trim(), caption: "" };
      }
      if (item && typeof item === "object" && item.url) {
        return {
          id: item._id || idx,
          url: String(item.url).trim(),
          caption: item.caption ? String(item.caption).trim() : "",
        };
      }
      return null;
    })
    .filter(Boolean);
}

export default function Gallery({ images, theme }) {
  const photos = normalizeImages(images);
  if (photos.length === 0) return null;

  const mutedClass = theme?.mutedClass || "text-muted";

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <h2 className="h5 mb-3">Galería</h2>
      <div className="row g-3">
        {photos.map((photo) => (
          <div className="col-12 col-sm-6 col-md-4" key={photo.id}>
            <figure className="mb-0 border p-2 h-100">
              <img
                src={photo.url}
                alt={photo.caption || "Foto del evento"}
                className="img-fluid w-100"
                style={{ maxHeight: "240px", objectFit: "cover" }}
                loading="lazy"
              />
              {photo.caption && (
                <figcaption className={`small ${mutedClass} mt-2`}>
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          </div>
        ))}
      </div>
    </div>
  );
}