"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

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
 * Landscape competitivo classificado. A Routine separa peers reais de
 * vendor platforms (Profound, AthenaHQ) de nomes alucinados. Mostra os
 * buckets honestamente — um vendor NUNCA é apresentado como concorrente.
 */
export function AppendixFLandscape({ deck }: SlideProps) {
  const synth = deck.synthesized;
  const profiles = synth?.competitor_profiles ?? [];

  // Sem competitor_profiles (audit pré-classificação) → não renderiza.
  if (profiles.length === 0) return null;

  const byBucket = (key: string) => profiles.filter((p) => p.classification === key);

  return (
    <SlideShell index={9} total={18} eyebrow="Landscape · quem a IA cita">
      <h2 className="tx-h2" style={{ marginBottom: 12, maxWidth: 900 }}>
        Quem aparece quando perguntam.
      </h2>
      {synth?.competitive_landscape_md && (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--ink-2)",
            maxWidth: 820,
            marginBottom: 32,
          }}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ margin: "0 0 0.7em" }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: "var(--ink)" }}>{children}</strong>,
            }}
          >
            {synth.competitive_landscape_md}
          </ReactMarkdown>
        </div>
      )}

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
          return (
            <motion.div
              key={bucket.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * bi }}
              style={{ borderTop: "2px solid var(--rule-soft)", paddingTop: 12 }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: bucket.key === "peer_consultancy" ? "var(--ink)" : "var(--ink-3)",
                  fontWeight: 500,
                  marginBottom: 2,
                }}
              >
                {bucket.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 10 }}>
                {bucket.note}
              </div>
              {items.length === 0 ? (
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--ink-3)",
                    fontStyle: "italic",
                  }}
                >
                  {bucket.key === "peer_consultancy" ? "Vácuo — oportunidade." : "—"}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((p) => (
                    <div key={p.name}>
                      <span
                        style={{
                          fontFamily: "var(--font-fraunces), Georgia, serif",
                          fontSize: 16,
                          color: "var(--ink)",
                        }}
                      >
                        {p.name}
                      </span>
                      {p.positioning_md && (
                        <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 8 }}>
                          {p.positioning_md.replace(/[*_`#]/g, "")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </SlideShell>
  );
}
