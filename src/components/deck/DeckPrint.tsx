"use client";

import { buildSlides } from "./slides";
import { SlidePositionContext } from "./SlidePosition";
import type { DeckData } from "./types";

/**
 * Render de impressão: TODOS os slides empilhados, cada um numa "página"
 * de tamanho fixo, sem navegação/wheel/controlos. Consumido pela rota
 * /proposta/[token]/print, que o endpoint download-pdf imprime via
 * chromium headless (page.pdf). Reutiliza EXACTAMENTE os mesmos
 * componentes de slide do deck web → web == PDF por construção, sem drift.
 *
 * Cada página tem a classe `deck` + data-tone para herdar o styling de
 * tom (ink/paper) que o CSS scopa sob `.deck`.
 */
export function DeckPrint({ deck }: { deck: DeckData }) {
  const slides = buildSlides(deck);
  const total = slides.length;
  return (
    <div className="deck-print" data-print-ready="true">
      {slides.map((s, i) => {
        const SlideComponent = s.Component;
        return (
          <section className="print-page deck" data-tone={s.tone} key={`${s.id}-${i}`}>
            <SlidePositionContext.Provider value={{ index: i + 1, total }}>
              <SlideComponent deck={deck} active />
            </SlidePositionContext.Provider>
          </section>
        );
      })}
    </div>
  );
}
