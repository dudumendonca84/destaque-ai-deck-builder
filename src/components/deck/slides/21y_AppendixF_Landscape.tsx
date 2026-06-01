"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";

const BUCKETS: Array<{
  key: "peer_consultancy" | "vendor_platform" | "adjacent" | "hallucinated";
  label: string;
  note: string;
}> = [
  { key: "peer_consultancy", label: "Concorrência directa", note: "mesma oferta, mesmo mercado" },
  { key: "vendor_platform", label: "Vendor tools", note: "produtos que o cliente compra — não concorrência" },
  { key: "adjacent", label: "Adjacentes", note: "SEO tradicional, individuais" },
  { key: "hallucinated", label: "Inventados pelos motores", note: "nomes que não existem — categoria imatura" },
];

/**
 * Paginação: se há `competitive_landscape_md` E há buckets, dividimos em
 * 2 slides — pág. 1 narrativa, pág. 2 grelha. Senão, 1 slide só com o
 * que houver. Garante que nem o markdown rico nem a grelha colidem com
 * a barra de navegação fixa.
 */
export function landscapePageCount(deck: DeckData): number {
  const synth = deck.synthesized;
  if (!synth) return 0;
  const hasProfiles = (synth.competitor_profiles?.length ?? 0) > 0;
  const hasNarrative = Boolean(synth.competitive_landscape_md?.trim());
  if (!hasProfiles && !hasNarrative) return 0;
  return hasProfiles && hasNarrative ? 2 : 1;
}

export function AppendixFLandscape({ deck, page = 0, pageCount = 1 }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;
  const profiles = synth.competitor_profiles ?? [];
  const narrative = synth.competitive_landscape_md?.trim() ?? "";
  const hasProfiles = profiles.length > 0;
  const hasNarrative = Boolean(narrative);

  if (!hasProfiles && !hasNarrative) return null;

  // Página 0: narrativa (se existe). Página 1 (ou 0 se sem narrativa): grelha.
  const showNarrative = hasNarrative && page === 0;
  const showBuckets = hasProfiles && (!hasNarrative || page === 1);

  const eyebrowBase = "Landscape · quem a IA cita";
  const eyebrow = pageCount > 1 ? `${eyebrowBase} · ${page + 1}/${pageCount}` : eyebrowBase;

  const byBucket = (key: string) => profiles.filter((p) => p.classification === key);

  return (
    <SlideShell eyebrow={eyebrow}>
      <h2 className="tx-h2" style={{ marginBottom: 20, maxWidth: 900 }}>
        Quem aparece quando perguntam.
      </h2>

      {/* 7/1 — narrativa editorial. A spec v12 prefere 3 colunas estritas
          (Orgânico PT / GEO declarado / Plataformas-ferramenta), mas isso
          exigia synthesized.landscape_overview estruturado da routine —
          não há hoje. Renderiza o markdown que a routine produz (já é o
          sumário) e fecha com o bloc-close amarelo do v12. */}
      {showNarrative && (
        <>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ink-2)",
              maxWidth: 880,
              marginBottom: 24,
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 0.7em" }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: "var(--ink)" }}>{children}</strong>,
              }}
            >
              {narrative}
            </ReactMarkdown>
          </div>
          <div className="bloc-close" style={{ maxWidth: 800 }}>
            O lugar está por preencher. Quem primeiro fixar entidade + prova de
            terceiros torna-se esse nome — uma janela que se fecha.
          </div>
        </>
      )}

      {/* 7/2 — buckets classificados em grelha 2x2, sistema bloc-rule.
          Destaque do "peer_consultancy" por PESO (régua preta + etiqueta a
          tinta cheia), não por caixa. */}
      {showBuckets && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 28,
            maxWidth: 1080,
          }}
        >
          {BUCKETS.map((bucket, bi) => {
            const items = byBucket(bucket.key);
            const isPeers = bucket.key === "peer_consultancy";
            return (
              <motion.div
                key={bucket.key}
                className="bloc-rule"
                data-rule="grouped"
                data-emphasis={isPeers ? "strong" : undefined}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 * bi }}
              >
                <span
                  className="bloc-rule__label"
                  data-tone={isPeers ? undefined : "category"}
                  style={{ marginBottom: 4 }}
                >
                  {bucket.label}
                </span>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-3)",
                    marginBottom: 10,
                    fontStyle: "italic",
                  }}
                >
                  {bucket.note}
                </div>
                {items.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
                    {isPeers ? "Vácuo — oportunidade." : "—"}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {items.slice(0, 6).map((p) => (
                      <div key={p.name} style={{ fontSize: 13.5 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-fraunces), Georgia, serif",
                            color: "var(--ink)",
                          }}
                        >
                          {p.name}
                        </span>
                      </div>
                    ))}
                    {items.length > 6 && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", fontStyle: "italic" }}>
                        +{items.length - 6} outros
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </SlideShell>
  );
}
