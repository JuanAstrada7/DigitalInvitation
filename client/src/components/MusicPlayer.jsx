import { useState } from "react";

export default function MusicPlayer({ musicUrl, theme }) {
  const [hasError, setHasError] = useState(false);

  const cleanUrl = typeof musicUrl === "string" ? musicUrl.trim() : "";
  if (!cleanUrl || hasError) return null;

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h2 className="h5 mb-0">Música del evento</h2>
        <span className="small text-muted">Reproductor de audio</span>
      </div>
      <audio
        controls
        preload="none"
        src={cleanUrl}
        className="w-100"
        onError={() => setHasError(true)}
      >
        Tu navegador no soporta reproducción de audio.
      </audio>
    </div>
  );
}