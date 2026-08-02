import { useEffect, useMemo, useState } from "react";

function Countdown({ targetDate }) {
  const targetTime = useMemo(() => {
    if (!targetDate) {
      return null;
    }

    const parsedDate = new Date(targetDate);

    return Number.isNaN(parsedDate.getTime())
      ? null
      : parsedDate.getTime();
  }, [targetDate]);

  const [remainingTime, setRemainingTime] = useState(
    calculateRemainingTime(targetTime)
  );

  useEffect(() => {
    setRemainingTime(
      calculateRemainingTime(targetTime)
    );

    if (!targetTime) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingTime(
        calculateRemainingTime(targetTime)
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTime]);

  if (!targetTime) {
    return null;
  }

  if (remainingTime.finished) {
    return (
      <section className="home-countdown">
        <p className="home-countdown__label">
          De wedstrijd is begonnen
        </p>

        <strong className="home-countdown__started">
          De ploegdeadline is verstreken.
        </strong>
      </section>
    );
  }

  return (
    <section className="home-countdown">
      <p className="home-countdown__label">
        Tijd tot de eerste etappe en ploegdeadline
      </p>

      <div className="home-countdown__grid">
        <TimeBlock
          value={remainingTime.days}
          label="dagen"
        />

        <TimeBlock
          value={remainingTime.hours}
          label="uren"
        />

        <TimeBlock
          value={remainingTime.minutes}
          label="minuten"
        />

        <TimeBlock
          value={remainingTime.seconds}
          label="seconden"
        />
      </div>
    </section>
  );
}

function TimeBlock({ value, label }) {
  return (
    <div className="home-countdown__block">
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}

function calculateRemainingTime(targetTime) {
  if (!targetTime) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true,
    };
  }

  const difference = targetTime - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true,
    };
  }

  return {
    days: Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ),
    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24
    ),
    minutes: Math.floor(
      (difference / (1000 * 60)) % 60
    ),
    seconds: Math.floor(
      (difference / 1000) % 60
    ),
    finished: false,
  };
}

export default Countdown;