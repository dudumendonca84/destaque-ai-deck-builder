import type { ProposalEvent } from "@/lib/supabase/types";
import { SLIDE_META, slideTitle } from "@/components/deck/slide-meta";

export type SlideStat = {
  n: number;
  title: string;
  seconds: number;
  views: number;
};

export type DropOff = {
  n: number;
  title: string;
  sessions: number;
};

export type AnalyticsStats = {
  totalOpens: number;
  uniqueSessions: number;
  totalSeconds: number;
  avgSessionSeconds: number;
  downloads: number;
  perSlide: SlideStat[];
  dropOff: DropOff[];
  maxSlideSeconds: number;
};

export function computeAnalytics(events: ProposalEvent[]): AnalyticsStats {
  const opens = events.filter((e) => e.event_type === "viewed");
  const views = events.filter((e) => e.event_type === "slide_viewed");
  const downloads = events.filter((e) => e.event_type === "download_pptx");

  const sessions = new Set(
    events.map((e) => e.session_id).filter((s): s is string => Boolean(s)),
  );

  const totalSeconds = views.reduce((acc, e) => acc + (e.duration_seconds ?? 0), 0);

  // Tempo e visualizações por slide.
  const perSlide: SlideStat[] = SLIDE_META.map((meta) => {
    const slideViews = views.filter((e) => e.slide_number === meta.n);
    return {
      n: meta.n,
      title: meta.title,
      seconds: slideViews.reduce((a, e) => a + (e.duration_seconds ?? 0), 0),
      views: slideViews.length,
    };
  });

  // Drop-off: slide mais avançado alcançado em cada sessão.
  const lastBySession = new Map<string, number>();
  for (const e of views) {
    if (!e.session_id || e.slide_number == null) continue;
    const prev = lastBySession.get(e.session_id) ?? 0;
    if (e.slide_number > prev) lastBySession.set(e.session_id, e.slide_number);
  }
  const dropCounts = new Map<number, number>();
  for (const n of lastBySession.values()) {
    dropCounts.set(n, (dropCounts.get(n) ?? 0) + 1);
  }
  const dropOff: DropOff[] = [...dropCounts.entries()]
    .map(([n, count]) => ({ n, title: slideTitle(n), sessions: count }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    totalOpens: opens.length,
    uniqueSessions: sessions.size,
    totalSeconds,
    avgSessionSeconds: sessions.size > 0 ? Math.round(totalSeconds / sessions.size) : 0,
    downloads: downloads.length,
    perSlide,
    dropOff,
    maxSlideSeconds: Math.max(1, ...perSlide.map((s) => s.seconds)),
  };
}
