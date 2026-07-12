"use client";

import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Território livre — onde a categoria do prospect ainda não tem dono nas
 * respostas de IA. Renderiza `territorio_livre_md` da síntese (Routine):
 * perguntas sem dono (fundo de funil primeiro), fontes citadas sem dono e o
 * ângulo de posicionamento por reclamar. É o slide de venda mais persuasivo
 * do deck: mostrar o espaço vago convence mais do que mostrar o problema.
 * Só entra no deck quando a síntese produziu o bloco (sem estado vazio).
 */
export function AppendixFTerritorio({ deck }: SlideProps) {
  const md = deck.synthesized?.territorio_livre_md;
  if (!md) return null;

  return (
    <SlideShell eyebrow="Território livre · onde há espaço para ganhar">
      <h2 className="tx-h1" style={{ marginBottom: 16 }}>
        A tua categoria tem respostas <em className="mark">sem dono</em>.
      </h2>
      <div className="deck-md body-m" style={{ maxWidth: 760, color: "var(--ink-2)" }}>
        <ReactMarkdown>{md}</ReactMarkdown>
      </div>
    </SlideShell>
  );
}
