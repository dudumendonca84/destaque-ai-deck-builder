export type TrackEventType =
  | "viewed"
  | "slide_viewed"
  | "cta_clicked"
  | "exited"
  | "download_pdf";

export type TrackEvent = {
  event_type: TrackEventType;
  slide_number?: number;
  slide_id?: string;
  duration_seconds?: number;
  session_id?: string;
};

const SESSION_KEY = "destaque_deck_session";

/** ID de sessão estável por aba/visita (sessionStorage). */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Envia um evento de tracking. Usa sendBeacon quando possível (sobrevive a unload). */
export function trackEvent(token: string, event: TrackEvent): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ ...event, session_id: event.session_id ?? getSessionId() });
  const url = `/api/proposals/${encodeURIComponent(token)}/track`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
