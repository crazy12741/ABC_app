import { useEffect, useState } from 'react';

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  totalMs: number;
};

export function useCountdown(target: string | null): Parts {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, totalMs: 0 };
  }

  const end = new Date(target).getTime();
  if (Number.isNaN(end)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, totalMs: 0 };
  }

  const totalMs = Math.max(0, end - now);
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);

  return { days, hours, minutes, seconds, expired: totalMs <= 0, totalMs };
}
