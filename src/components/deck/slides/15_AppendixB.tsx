"use client";

import { SlideShell } from "../primitives/SlideShell";
import { eur } from "@/lib/utils/format";
import type { SlideProps } from "../types";

export function AppendixB({ deck }: SlideProps) {
  return (
    <SlideShell index={15} total={22} eyebrow="Apêndice B · Sprint">
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        Sprint — <em className="mark">a execução</em>
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24 }}>
        4-6 semanas · {eur(deck.pricing.sprint)} · one-off
      </p>
      <ul className="deck-list">
        <li>
          <b>Técnico</b>
          <span>Schema.org, dados estruturados, llms.txt e infraestrutura GEO.</span>
        </li>
        <li>
          <b>Editorial</b>
          <span>Conteúdo extraível e páginas-resposta para as intenções-chave.</span>
        </li>
        <li>
          <b>Autoridade</b>
          <span>Sinais externos e presença nas fontes que os modelos citam.</span>
        </li>
      </ul>
    </SlideShell>
  );
}
