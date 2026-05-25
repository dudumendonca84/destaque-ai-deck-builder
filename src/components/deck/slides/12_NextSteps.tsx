"use client";

import { SlideShell } from "../primitives/SlideShell";

const STEPS = [
  { n: "01", t: "Conversa de alinhamento", d: "30 minutos para confirmar contexto, objectivos e âmbito." },
  { n: "02", t: "Arranque do diagnóstico", d: "Auditoria GEO completa e roadmap priorizado em 2 semanas." },
  { n: "03", t: "Decisão sobre o sprint", d: "Revemos o roadmap juntos e decidimos a implementação." },
];

export function NextSteps() {
  return (
    <SlideShell index={12} total={19} eyebrow="A seguir">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        O que acontece <em className="mark">a partir daqui</em>
      </h2>
      <ul className="steps-table">
        {STEPS.map((s) => (
          <li key={s.n}>
            <span className="steps-table__n">{s.n}</span>
            <span className="steps-table__t">{s.t}</span>
            <span className="steps-table__d">{s.d}</span>
          </li>
        ))}
      </ul>
    </SlideShell>
  );
}
