"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";

const GEO_TOOLS = [
  "profound",
  "otterly.ai",
  "otterly",
  "peec ai",
  "peec.ai",
  "athenahq",
  "athena hq",
  "brightedge",
  "conductor",
  "semrush",
  "ahrefs",
  "kalicube",
  "searchmetrics",
];

function isGeoTool(brand: string): boolean {
  const norm = brand.trim().toLowerCase();
  return GEO_TOOLS.some((t) => norm === t || norm.startsWith(`${t} `));
}

export function villainNames(deck: DeckData): string[] {
  const peers =
    deck.synthesized?.competitor_profiles?.filter((p) => p.classification === "peer_consultancy") ??
    [];
  if (peers.length > 0) return peers.slice(0, 3).map((p) => p.name);

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
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "24px 40px",
          maxWidth: 820,
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
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.1,
              color: "var(--ink)",
            }}
          >
            {name}
          </motion.div>
        ))}
      </div>
      <p
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 20,
          color: "var(--ink)",
          marginTop: 34,
        }}
      >
        A <em className="mark">{deck.companyName}</em> ainda não está nessa lista.
      </p>
    </SlideShell>
  );
}
