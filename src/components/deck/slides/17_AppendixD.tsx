"use client";

import { SlideShell } from "../primitives/SlideShell";
import { eur } from "@/lib/utils/format";
import type { SlideProps } from "../types";

export function AppendixD({ deck }: SlideProps) {
  const rows = [
    { phase: "Diagnóstico", dur: "2 semanas", price: eur(deck.pricing.diagnostico), unit: "one-off" },
    { phase: "Sprint", dur: "4-6 semanas", price: eur(deck.pricing.sprint), unit: "one-off" },
    { phase: "Retainer", dur: "mensal", price: eur(deck.pricing.retainer), unit: "/ mês" },
  ];
  return (
    <SlideShell index={17} total={18} eyebrow="Apêndice D · Investimento">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Resumo do <em className="mark">investimento</em>
      </h2>
      <table className="invest-table">
        <thead>
          <tr>
            <th>Fase</th>
            <th>Duração</th>
            <th>Investimento</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.phase}>
              <td className="invest-table__phase">{r.phase}</td>
              <td>{r.dur}</td>
              <td className="invest-table__price">
                {r.price} <span>{r.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 18 }}>
        Valores sem IVA. As fases são sequenciais — podes parar no fim de qualquer uma.
      </p>
    </SlideShell>
  );
}
