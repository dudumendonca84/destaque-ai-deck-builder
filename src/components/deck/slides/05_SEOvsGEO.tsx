"use client";

import { SlideShell } from "../primitives/SlideShell";
import { ENGINE_COUNT } from "@/lib/llm/models";

const ROWS = [
  { seo: "Otimizas para 10 links azuis", geo: "Otimizas para 1 resposta" },
  { seo: "O utilizador escolhe entre resultados", geo: "A IA escolhe por ele" },
  { seo: "Palavras-chave e backlinks", geo: "Estrutura, autoridade e citabilidade" },
  { seo: "Medes posições no Google", geo: `Medes menções em ${ENGINE_COUNT} motores de IA` },
];

export function SEOvsGEO() {
  return (
    <SlideShell eyebrow="SEO vs GEO">
      <h2 className="tx-h2" style={{ marginBottom: 12 }}>
        O GEO <em className="mark">assenta</em> sobre o SEO.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28, maxWidth: 780 }}>
        <strong style={{ color: "var(--ink-2)" }}>54%</strong> das citações em AI
        Overviews vêm do top-10 orgânico. O SEO é o substrato; o GEO é a camada que te
        torna citável. Precisas dos dois.{" "}
        <span style={{ color: "var(--ink-4)" }}>Fonte: BrightEdge, 2026.</span>
      </p>
      <div className="compare">
        <div className="compare__col">
          <span className="compare__head">SEO</span>
          {ROWS.map((r) => (
            <span className="compare__cell" key={r.seo}>
              {r.seo}
            </span>
          ))}
        </div>
        <div className="compare__col compare__col--accent">
          <span className="compare__head">GEO</span>
          {ROWS.map((r) => (
            <span className="compare__cell" key={r.geo}>
              {r.geo}
            </span>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
