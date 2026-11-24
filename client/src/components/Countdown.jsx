import { useEffect, useState } from "react";

function getTimeRemaining(targetDate) {
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();

  if (!targetDate || Number.isNaN(target) || diff <= 0) {
    return null;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function Countdown({ eventDate, theme }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(eventDate));

  useEffect(() => {
    setTimeLeft(getTimeRemaining(eventDate));
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(eventDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  if (!timeLeft) return null;

  const items = [
    { label: "Días", value: timeLeft.days },
    { label: "Horas", value: timeLeft.hours },
    { label: "Minutos", value: timeLeft.minutes },
    { label: "Segundos", value: timeLeft.seconds },
  ];

  return (
    <div className={`${theme.cardClass} mt-4`}>
      <h2 className="h5 mb-3">Falta muy poco</h2>
      <div className="row g-2 text-center">
        {items.map((item) => (
          <div className="col-6 col-sm-3" key={item.label}>
            <div className="border p-3">
              <div className="fs-3 fw-bold">
                {String(item.value).padStart(2, "0")}
              </div>
              <div className="small text-muted">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}