"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  active: boolean;
  suffix?: string;
  durationMs?: number;
};

/** Em print/PDF (chromium) saltamos a animação e fixamos o valor final.
 * O headless captura a página após ~1200ms de settle — se boa parte disso
 * for hidratação, o RAF apanha-se a meio (vê-se 28-38 onde devia ser 60).
 * Calculado uma só vez por mount via lazy init para evitar setState num
 * effect (react-hooks/set-state-in-effect). */
function isInsidePrintDeck(): boolean {
  return typeof document !== "undefined" && !!document.querySelector(".deck-print");
}

/** Conta de 0 até `to` com easeOutCubic quando o slide fica activo. */
export function Counter({ to, active, suffix = "", durationMs = 1300 }: Props) {
  // `isPrint` derivado uma vez no mount (lazy initialiser). Imutável depois,
  // partilhado por render e effect — sem ref durante render, sem setState
  // no effect.
  const [isPrint] = useState(isInsidePrintDeck);
  const [progress, setProgress] = useState(() => (isInsidePrintDeck() ? to : 0));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active || isPrint) return;
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
  }, [to, active, durationMs, isPrint]);

  // Slide inactivo mostra 0 (derivado, sem setState no efeito).
  // Em print, mostra `to` sempre (independente de `active`).
  const value = isPrint ? to : active ? progress : 0;

  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}
