"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { isGeoTool, ptPeerScore } from "@/lib/skill/geo-tools";

export function villainNames(deck: DeckData): string[] {
  // 1. Peers classificados pela síntese, REORDENADOS para liderar com PT.
  const peers =
    deck.synthesized?.competitor_profiles?.filter((p) => p.classification === "peer_consultancy") ??
    [];
  if (peers.length > 0) {
    const ranked = peers
      .map((p, i) => ({ p, i, score: ptPeerScore(p.positioning_md) }))
      // score desc; empate mantém ordem original (estável via índice)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((x) => x.p.name);
    return ranked.slice(0, 3);
  }

  // 2. Concorrentes declarados manualmente no admin (ProposalWizard).
  const declared = (deck.competitors ?? []).filter((n) => n.trim().length > 0 && !isGeoTool(n));
  if (declared.length > 0) return declared.slice(0, 3);

  // 3. Top competitors agregados do audit summary, filtrando vendor tools.
  const top = (deck.audit?.summary?.top_competitors ?? []).filter((n) => !isGeoTool(n));
  return top.slice(0, 3);
}

export function hasVillainData(deck: DeckData): boolean {
  return villainNames(deck).length > 0;
}

export function Villain({ deck, active }: SlideProps) {
  const names = villainNames(deck);
  if (names.length === 0) return null;

  const countWord = names.length === 1 ? "um nome" : names.length === 2 ? "dois nomes" : "três nomes";
  const isOne = names.length === 1;

  return (
    <SlideShell eyebrow="Quem aparece">
      <h2 className="tx-h2" style={{ marginBottom: 16 }}>
        E o nome não é o <em className="mark">teu</em>.
      </h2>
      <p
        className="body-m"
        style={{ color: "var(--ink-3)", maxWidth: 760, marginBottom: 32 }}
      >
        Agora mesmo, um comprador pergunta à IA pela tua categoria. A resposta traz {countWord} —
        e hoje {isOne ? "é o teu concorrente" : "são os teus concorrentes"}.
      </p>
      <div
        style={{
          display: "grid",
          // minmax(280px, 1fr) garante: a 1280 cabem 3 colunas (~300px
          // cada, espaço para "Infinidata" sem overflow); a 390px colapsa
          // para 1 coluna empilhada. align-items:start mantém os nomes
          // alinhados no topo mesmo quando "AISO Hub" parte para 2 linhas.
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          alignItems: "start",
          gap: "32px 48px",
          maxWidth: 980,
        }}
      >
        {names.map((name, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.12 }}
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "var(--fs-display-2)",
              lineHeight: 1.1,
              color: "var(--ink)",
              minWidth: 0,
              textAlign: "center",
              overflowWrap: "break-word",
            }}
          >
            {name}
          </motion.div>
        ))}
      </div>
      <p
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: "var(--fs-h2)",
          color: "var(--ink)",
          marginTop: 34,
        }}
      >
        A <em className="mark">{deck.companyName}</em> ainda não está nessa lista.
      </p>
    </SlideShell>
  );
}
