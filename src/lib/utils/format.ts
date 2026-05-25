export function eur(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Variante do formatter de euros para o deck: se o valor for null/undefined
 * devolve "Sob consulta" (em vez de "—"). 0 é mostrado como gratuito.
 */
export function eurOrPlaceholder(
  value: number | null | undefined,
  placeholder = "Sob consulta",
): string {
  if (value == null) return placeholder;
  if (value === 0) return "Gratuito";
  return eur(value);
}

export function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function dateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
