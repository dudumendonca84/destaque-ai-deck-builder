"use client";

import { SlideShell } from "../primitives/SlideShell";

const ROWS = [
  { seo: "Otimizas para 10 links azuis", geo: "Otimizas para 1 resposta" },
  { seo: "O utilizador escolhe entre resultados", geo: "A IA escolhe por ele" },
  { seo: "Palavras-chave e backlinks", geo: "Estrutura, autoridade e citabilidade" },
  { seo: "Medes posições no Google", geo: "Medes menções em 4 motores de IA" },
];

export function SEOvsGEO() {
  return (
    <SlideShell index={5} total={18} eyebrow="SEO vs GEO">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Não substitui o SEO. <em className="mark">Sucede-o</em>.
      </h2>
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
