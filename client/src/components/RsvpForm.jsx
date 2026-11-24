import { useState } from "react";
import Swal from "sweetalert2";

export default function RsvpForm({ slug, apiUrl, theme }) {
  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState("yes");
  const [guestsCount, setGuestsCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!guestName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Falta tu nombre",
        text: "Por favor ingresá tu nombre y apellido para confirmar.",
      });
      return;
    }

    const payload = {
      guestName: guestName.trim(),
      attending: attending === "yes",
      guestsCount: attending === "yes" ? Number(guestsCount) || 1 : 0,
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/invitations/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Endpoint RSVP aún no disponible (${res.status})`);
      }

      Swal.fire({
        icon: "success",
        title: "¡Confirmación enviada!",
        text: payload.attending
          ? `Gracias ${payload.guestName}, registramos tu asistencia (${payload.guestsCount} persona/s).`
          : `Gracias ${payload.guestName}, avisamos que no podrás asistir.`,
      });

      setGuestName("");
      setNotes("");
      setGuestsCount(1);
      setAttending("yes");
    } catch {
      Swal.fire({
        icon: "info",
        title: "Confirmación registrada en vista previa",
        html: `
          <div class="text-start small">
            <p class="mb-1"><strong>Invitado:</strong> ${payload.guestName}</p>
            <p class="mb-1"><strong>Asiste:</strong> ${payload.attending ? "Sí" : "No"}</p>
            <p class="mb-1"><strong>Cantidad:</strong> ${payload.guestsCount}</p>
            <p class="mb-0"><strong>Nota:</strong> ${payload.notes || "—"}</p>
          </div>
        `,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Confirmar asistencia (RSVP)</h2>
        <span className={theme.badgeClass}>{theme.label}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre y apellido *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej. Juan Pérez"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">¿Vas a asistir?</label>
            <select
              className="form-select"
              value={attending}
              onChange={(e) => setAttending(e.target.value)}
            >
              <option value="yes">Sí, ahí estaré</option>
              <option value="no">No podré asistir</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Cantidad de personas</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-control"
              disabled={attending !== "yes"}
              value={attending === "yes" ? guestsCount : 0}
              onChange={(e) => setGuestsCount(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Restricciones alimentarias o mensaje</label>
          <textarea
            rows="2"
            className="form-control"
            placeholder="Opcional: vegetariano, sin TACC, canción..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className={theme.btnClass} disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar confirmación"}
        </button>
      </form>
    </div>
  );
}