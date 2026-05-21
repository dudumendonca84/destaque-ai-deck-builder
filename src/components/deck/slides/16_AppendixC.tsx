"use client";

import { SlideShell } from "../primitives/SlideShell";
import { eur } from "@/lib/utils/format";
import type { SlideProps } from "../types";

export function AppendixC({ deck }: SlideProps) {
  return (
    <SlideShell index={16} total={18} eyebrow="Apêndice C · Retainer">
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        Retainer — <em className="mark">a operação</em>
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24 }}>
        Mensal · {eur(deck.pricing.retainer)} / mês
      </p>
      <ul className="deck-list">
        <li>
          <b>Monitorização</b>
          <span>Tracking contínuo de citações e share of voice nos 4 motores.</span>
        </li>
        <li>
          <b>Iteração</b>
          <span>Ajustes à medida que os modelos e o mercado evoluem.</span>
        </li>
        <li>
          <b>Relatório</b>
          <span>Dashboard com acesso e report consolidado todos os meses.</span>
        </li>
      </ul>
    </SlideShell>
  );
}
