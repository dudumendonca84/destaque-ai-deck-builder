"use client";

import { SlideShell } from "../primitives/SlideShell";

export function Phases12() {
  return (
    <SlideShell index={8} total={22} eyebrow="Fases 1 e 2">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Diagnóstico e <em className="mark">conteúdo</em>
      </h2>
      <div className="phase-pair">
        <div className="phase">
          <span className="phase__n">Fase 01 · Auditoria</span>
          <span className="phase__dur">2 semanas</span>
          <p className="phase__lead">
            Mapeamos onde estás hoje em cada motor e porquê.
          </p>
          <ul className="phase__list">
            <li>Auditoria GEO completa, prompts reais</li>
            <li>Benchmark competitivo</li>
            <li>Roadmap priorizado por impacto</li>
          </ul>
        </div>
        <div className="phase">
          <span className="phase__n">Fase 02 · Conteúdo</span>
          <span className="phase__dur">4-6 semanas</span>
          <p className="phase__lead">
            Tornamos a tua marca legível e citável pela IA.
          </p>
          <ul className="phase__list">
            <li>Schema.org e dados estruturados</li>
            <li>Conteúdo extraível, llms.txt</li>
            <li>Páginas-resposta para intenções-chave</li>
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}
