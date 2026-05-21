"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  active: boolean;
  suffix?: string;
  durationMs?: number;
};

/** Conta de 0 até `to` com easeOutCubic quando o slide fica activo. */
export function Counter({ to, active, suffix = "", durationMs = 1300 }: Props) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(to * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [to, active, durationMs]);

  // Slide inactivo mostra 0 (derivado, sem setState no efeito).
  const value = active ? progress : 0;

  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}
