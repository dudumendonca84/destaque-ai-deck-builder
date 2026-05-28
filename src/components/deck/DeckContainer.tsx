"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, Download } from "lucide-react";
import { DeckNav } from "./DeckNav";
import { buildSlides } from "./slides";
import type { DeckData } from "./types";
import { trackEvent } from "@/lib/analytics/track";

export function DeckContainer({ deck }: { deck: DeckData }) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const enteredAt = useRef<number>(0);
  const deckOpenedAt = useRef<number>(0);
  const wheelLock = useRef(false);
  const touchStart = useRef<number | null>(null);

  // Sequência dinâmica: pagina LiveAudit/Findings e salta slides sem dados.
  const slides = useMemo(() => buildSlides(deck), [deck]);
  const total = slides.length;

  const slide = slides[current] ?? slides[0];

  /** Envia o tempo passado no slide actual e reposiciona o cronómetro. */
  const flushDuration = useCallback(
    (slideIndex: number) => {
      const seconds = Math.round((Date.now() - enteredAt.current) / 1000);
      if (seconds > 0) {
        trackEvent(deck.token, {
          event_type: "slide_viewed",
          slide_number: slideIndex + 1,
          slide_id: slides[slideIndex]?.id,
          duration_seconds: seconds,
        });
      }
      enteredAt.current = Date.now();
    },
    [deck.token, slides],
  );

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      if (clamped === current) return;
      flushDuration(current);
      setCurrent(clamped);
    },
    [current, total, flushDuration],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Abertura do deck + flush final ao fechar/esconder.
  useEffect(() => {
    enteredAt.current = Date.now();
    deckOpenedAt.current = Date.now();
    trackEvent(deck.token, { event_type: "viewed" });
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        flushDuration(current);
        trackEvent(deck.token, {
          event_type: "exited",
          slide_number: current + 1,
          duration_seconds: Math.round((Date.now() - deckOpenedAt.current) / 1000),
        });
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === " ") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Fullscreen state sync.
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // Scroll / wheel.
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (wheelLock.current) return;
      if (Math.abs(e.deltaY) < 30) return;
      wheelLock.current = true;
      if (e.deltaY > 0) next();
      else prev();
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 700);
    },
    [next, prev],
  );

  // Swipe mobile.
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStart.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  const SlideComponent = slide.Component;

  return (
    <div
      className="deck"
      data-tone={slide.tone}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barra de progresso amarela */}
      <div className="deck-progress">
        <motion.div
          className="deck-progress__fill"
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.6, 0.05, 0.2, 1] }}
        />
      </div>

      {/* Controlos topo-direita */}
      <div className="deck-controls" data-tone={slide.tone}>
        <a
          className="deck-controls__btn"
          href={`/api/proposals/${deck.token}/download-pdf`}
          onClick={() =>
            trackEvent(deck.token, { event_type: "download_pdf", slide_number: current + 1 })
          }
          aria-label="Download PDF"
        >
          <Download size={16} strokeWidth={1.6} />
        </a>
        <button
          type="button"
          className="deck-controls__btn"
          onClick={toggleFullscreen}
          aria-label="Ecrã inteiro"
        >
          {fullscreen ? (
            <Minimize2 size={16} strokeWidth={1.6} />
          ) : (
            <Maximize2 size={16} strokeWidth={1.6} />
          )}
        </button>
      </div>

      {/* Slide activo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className="deck-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SlideComponent deck={deck} active />
        </motion.div>
      </AnimatePresence>

      <DeckNav
        current={current}
        total={total}
        tone={slide.tone}
        onPrev={prev}
        onNext={next}
        onJump={goTo}
      />
    </div>
  );
}
