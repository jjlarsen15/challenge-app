"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";

const TWELVE_HOURS_SECONDS = 12 * 60 * 60;

export function CountdownTimer() {
  const [secondsLeft, setSecondsLeft] = useState(TWELVE_HOURS_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [secondsLeft]);

  if (secondsLeft <= 0) {
    return (
      <p className="text-3xl font-bold tracking-tight text-rose-600 sm:text-4xl">
        Challenge Over
      </p>
    );
  }

  return (
    <p className="font-mono text-4xl font-bold tracking-wider text-slate-900 sm:text-5xl">
      {formatCountdown(secondsLeft)}
    </p>
  );
}
