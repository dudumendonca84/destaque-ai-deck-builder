"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { ptPeerScore } from "@/lib/skill/geo-tools";

type Profile = NonNullable<DeckData["synthesized"]>["competitor_profiles"] extends
  | Array<infer T>
  | undefined
  ? T
  : never;

/**
 * Landscape competitivo em TRÊS CAMADAS (Step 5b do v12) — não parede de
 * texto. Mapa de 3 colunas paralelas sobre régua, derivado dos
 * competitor_profiles:
 *
 *   Camada 1 · incumbentes  — peers PT sem GEO declarado (SEO clássico)
 *   Camada 2 · desafiantes  — peers que já declaram GEO/AEO
 *   Camada 3 · o lugar vazio (HERÓI) — motores recorrem a nomes ES; a
 *             fonte PT-PT citável não existe → lacuna = oportunidade
 *
 * + Nota recuada: vendor platforms (Profound/AthenaHQ…) = não concorrentes
 * + Fecho com barra amarela.
 *
 * Cabe num slide, sem scroll. Fallback: se não há competitor_profiles mas
 * há competitive_landscape_md, renderiza o markdown (1 slide).
 */

function declaresGeo(positioning: string): boolean {
  const p = positioning.toLowerCase();
  return (
    p.includes("[via web search]") ||
    /\bgeo\b|\baeo\b|ai search|llmo|knowledge graph|entity-first|structured data/.test(p)
  );
}

/** incumbent (PT clássico) | challenger (declara GEO) | foreign (ES/intl) */
function layerOf(p: Profile): "incumbent" | "challenger" | "foreign" {
  const pos = p.positioning_md ?? "";
  if (ptPeerScore(pos) < 0) return "foreign";
  if (declaresGeo(pos)) return "challenger";
  return "incumbent";
}

export function landscapePageCount(deck: DeckData): number {
  const synth = deck.synthesized;
  if (!synth) return 0;
  const hasProfiles = (synth.competitor_profiles?.length ?? 0) > 0;
  const hasNarrative = Boolean(synth.competitive_landscape_md?.trim());
  return hasProfiles || hasNarrative ? 1 : 0;
}

function NameList({ names }: { names: string[] }) {
  if (names.length === 0) {
    return (
      <span style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>—</span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "var(--font-mono-jetbrains)",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: "var(--ink-2)",
      }}
    >
      {names.join(" · ")}
    </span>
  );
}

export function AppendixFLandscape({ deck }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;
  const profiles = (synth.competitor_profiles ?? []) as Profile[];
  const narrative = synth.competitive_landscape_md?.trim() ?? "";

  // Fallback: sem profiles classificados → markdown (não ideal mas seguro).
  if (profiles.length === 0) {
    if (!narrative) return null;
    return (
      <SlideShell eyebrow="Landscape · quem a IA cita">
        <h2 className="tx-h2" style={{ marginBottom: 20, maxWidth: 900 }}>
          Quem aparece quando perguntam.
        </h2>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 880 }}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ margin: "0 0 0.7em" }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: "var(--ink)" }}>{children}</strong>,
            }}
          >
            {narrative}
          </ReactMarkdown>
        </div>
      </SlideShell>
    );
  }

  const peers = profiles.filter((p) => p.classification === "peer_consultancy");
  const sortPt = (arr: Profile[]) =>
    arr
      .map((p, i) => ({ p, i, s: ptPeerScore(p.positioning_md) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.p.name);

  const incumbents = sortPt(peers.filter((p) => layerOf(p) === "incumbent")).slice(0, 4);
  const challengers = sortPt(peers.filter((p) => layerOf(p) === "challenger")).slice(0, 5);
  const foreign = peers.filter((p) => layerOf(p) === "foreign").map((p) => p.name).slice(0, 3);

  const vendors = profiles
    .filter((p) => p.classification === "vendor_platform")
    .map((p) => p.name)
    .slice(0, 6);

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--ink-3)",
    marginBottom: 8,
    display: "block",
  };
  const heroStyle: React.CSSProperties = {
    fontFamily: "var(--font-fraunces), Georgia, serif",
    fontSize: 21,
    lineHeight: 1.15,
    color: "var(--ink)",
    marginBottom: 10,
  };
  const ctxStyle: React.CSSProperties = {
    fontSize: 11.5,
    lineHeight: 1.5,
    color: "var(--ink-3)",
    marginBottom: 14,
  };

  return (
    <SlideShell eyebrow="Landscape · quem a IA cita">
      <h2 className="tx-h2" style={{ marginBottom: 6 }}>
        Quem aparece quando perguntam.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28, maxWidth: 880 }}>
        O mercado PT lê-se em três camadas — e o lugar de consultoria GEO PT-PT está por ocupar.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 36,
          maxWidth: 1180,
        }}
      >
        {/* Camada 1 — incumbentes */}
        <div style={{ borderTop: "1px solid var(--rule-paper)", paddingTop: 12 }}>
          <span style={labelStyle}>Camada 1 · incumbentes</span>
          <div style={heroStyle}>SEO clássico, GEO experimental.</div>
          <div style={ctxStyle}>
            Dominam o orgânico, mas tratam GEO como linha experimental — não como prática madura.
          </div>
          <NameList names={incumbents} />
        </div>

        {/* Camada 2 — desafiantes */}
        <div style={{ borderTop: "1px solid var(--rule-paper)", paddingTop: 12 }}>
          <span style={labelStyle}>Camada 2 · desafiantes</span>
          <div style={heroStyle}>Já declaram GEO/AEO.</div>
          <div style={ctxStyle}>
            Em formação acelerada — já com discurso de entidade e dados estruturados para os motores.
          </div>
          <NameList names={challengers} />
        </div>

        {/* Camada 3 — o lugar vazio (HERÓI: régua preta + etiqueta a tinta) */}
        <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 12 }}>
          <span style={{ ...labelStyle, color: "var(--ink)" }}>Camada 3 · o lugar vazio</span>
          <div style={heroStyle}>
            A fonte PT-PT citável <em style={{ fontStyle: "italic" }}>que não existe</em>.
          </div>
          <div style={ctxStyle}>
            Perguntados por consultoras GEO PT, os motores recorrem a nomes ES
            {foreign.length ? ` (${foreign.join(", ")})` : ""} e admitem um mercado «imaturo».
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono-jetbrains)",
              fontSize: 12,
              color: "var(--amber-label)",
            }}
          >
            ← lacuna geográfica = oportunidade
          </span>
        </div>
      </motion.div>

      {/* Nota (vendors) + fecho amarelo, em 2 colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 36,
          maxWidth: 1180,
          marginTop: 36,
          alignItems: "start",
        }}
      >
        <div style={{ borderTop: "1px solid var(--rule-paper)", paddingTop: 12 }}>
          <span style={labelStyle}>Nota · não confundir</span>
          <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "var(--ink-3)" }}>
            {vendors.length ? `${vendors.join(", ")} ` : "Profound, AthenaHQ, Peec, Semrush "}
            são <strong style={{ color: "var(--ink-2)" }}>plataformas</strong> que uma
            consultoria integra e revende — não concorrentes.
          </div>
        </div>
        <div className="bloc-close">
          O lugar está por preencher. Quem primeiro fixar entidade + prova de terceiros torna-se
          esse nome — uma janela que se fecha.
        </div>
      </div>
    </SlideShell>
  );
}
