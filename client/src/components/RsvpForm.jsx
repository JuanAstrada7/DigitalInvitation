import { useState } from "react";
import Swal from "sweetalert2";
import { createGuestRsvp } from "../services/api";

export default function RsvpForm({ slug, theme }) {
  const [fullName, setFullName] = useState("");
  const [attending, setAttending] = useState("yes");
  const [totalPeople, setTotalPeople] = useState(1);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fullName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Falta tu nombre",
        text: "Por favor ingresá tu nombre y apellido para confirmar.",
      });
      return;
    }

    const willAttend = attending === "yes";
    const parsedPeople = willAttend ? Math.max(1, Number(totalPeople) || 1) : 0;
    const companions = willAttend ? Math.max(0, parsedPeople - 1) : 0;

    const payload = {
      slug,
      fullName: fullName.trim(),
      attending: willAttend,
      companions,
      dietaryRestrictions: dietaryRestrictions.trim(),
      songRequest: songRequest.trim(),
      message: message.trim(),
    };

    setSubmitting(true);
    try {
      await createGuestRsvp(payload);

      Swal.fire({
        icon: "success",
        title: "¡Confirmación enviada!",
        text: willAttend
          ? `Gracias ${payload.fullName}, registramos tu asistencia (${parsedPeople} persona/s).`
          : `Gracias ${payload.fullName}, registramos que no podrás asistir.`,
      });

      setFullName("");
      setAttending("yes");
      setTotalPeople(1);
      setDietaryRestrictions("");
      setSongRequest("");
      setMessage("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: err.message || "Ocurrió un error al enviar tu confirmación.",
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
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
            <label className="form-label">Cantidad total de personas (incluyéndote)</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-control"
              disabled={attending !== "yes"}
              value={attending === "yes" ? totalPeople : 0}
              onChange={(e) => setTotalPeople(e.target.value)}
            />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Restricciones alimentarias</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Vegetariano, celíaco / sin TACC..."
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">¿Qué canción no puede faltar?</label>
            <input
              type="text"
              className="form-control"
              placeholder="Opcional"
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Mensaje para los anfitriones</label>
          <textarea
            rows="2"
            className="form-control"
            placeholder="Opcional"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button type="submit" className={theme.btnClass} disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar confirmación"}
        </button>
      </form>
    </div>
  );
}