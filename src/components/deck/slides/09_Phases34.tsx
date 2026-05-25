"use client";

import { SlideShell } from "../primitives/SlideShell";
import { ENGINE_COUNT } from "@/lib/llm/models";

export function Phases34() {
  return (
    <SlideShell index={9} total={19} eyebrow="Fases 3 e 4">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Distribuição e <em className="mark">medição</em>
      </h2>
      <div className="phase-pair">
        <div className="phase">
          <span className="phase__n">Fase 03 · Distribuição</span>
          <span className="phase__dur">contínua</span>
          <p className="phase__lead">
            Construímos autoridade onde os modelos vão buscar.
          </p>
          <ul className="phase__list">
            <li>Presença em fontes que a IA cita</li>
            <li>Sinais de autoridade externos</li>
            <li>Cobertura editorial distribuída</li>
          </ul>
        </div>
        <div className="phase">
          <span className="phase__n">Fase 04 · Medição</span>
          <span className="phase__dur">mensal</span>
          <p className="phase__lead">
            Monitorizamos os {ENGINE_COUNT} motores e iteramos com dados.
          </p>
          <ul className="phase__list">
            <li>Tracking de citações e share of voice</li>
            <li>Ajustes conforme os modelos evoluem</li>
            <li>Relatório consolidado mensal</li>
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}
