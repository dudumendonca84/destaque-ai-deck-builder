"use client";

import { SlideShell } from "../primitives/SlideShell";
import { eur } from "@/lib/utils/format";
import { ENGINE_COUNT } from "@/lib/llm/models";
import type { SlideProps } from "../types";

export function AppendixA({ deck }: SlideProps) {
  const priceLine =
    deck.pricing.diagnostico != null
      ? `2 semanas · ${eur(deck.pricing.diagnostico)} · one-off`
      : "2 semanas · Sob consulta";
  return (
    <SlideShell index={14} total={19} eyebrow="Apêndice A · Diagnóstico">
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        Diagnóstico — <em className="mark">o mapa</em>
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24 }}>
        {priceLine}
      </p>
      <ul className="deck-list">
        <li>
          <b>Auditoria GEO</b>
          <span>
            {deck.prompts.length} prompts reais corridos em {ENGINE_COUNT} motores —{" "}
            {deck.prompts.length * ENGINE_COUNT} respostas analisadas marca a marca.
          </span>
        </li>
        <li>
          <b>Benchmark</b>
          <span>A tua posição face à concorrência directa, motor a motor.</span>
        </li>
        <li>
          <b>Roadmap</b>
          <span>Acções ordenadas por esforço e retorno, prontas a executar.</span>
        </li>
      </ul>
    </SlideShell>
  );
}
