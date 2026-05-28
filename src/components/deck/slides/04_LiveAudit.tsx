"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SlideProps, DeckData } from "../types";
import { ENGINES, ENGINE_LABEL, type Engine } from "@/lib/llm/models";
import type { AuditRun } from "@/lib/supabase/types";

const PROMPTS_PER_PAGE = 3;

/** Prompts com pelo menos 1 motor com resposta real (exclui circuit/fail/no-key). */
export function liveAuditPrompts(deck: DeckData): string[] {
  const all = deck.prompts.length ? deck.prompts : [];
  return all.filter((prompt) =>
    ENGINES.some((engine) => {
      const r = deck.auditRuns.find((x) => x.prompt === prompt && x.engine === engine);
      return r?.response && r.brand_present !== null;
    }),
  );
}

/** Nº de slides LiveAudit necessários para mostrar todos os prompts com dados. */
export function liveAuditPageCount(deck: DeckData): number {
  return Math.max(1, Math.ceil(liveAuditPrompts(deck).length / PROMPTS_PER_PAGE));
}

/** Parte o texto realçando a marca (you) e os concorrentes (comp). */
function highlight(text: string, brand: string, competitors: string[]) {
  const terms: { term: string; kind: "you" | "comp" }[] = [];
  if (brand.trim().length > 1) terms.push({ term: brand, kind: "you" });
  for (const c of competitors) {
    if (c.trim().length > 1) terms.push({ term: c, kind: "comp" });
  }
  if (terms.length === 0) return [{ text, kind: null as null | "you" | "comp" }];
  const escaped = terms.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part) => {
    const m = terms.find((t) => t.term.toLowerCase() === part.toLowerCase());
    return { text: part, kind: m?.kind ?? null };
  });
}

function Excerpt({
  run,
  brand,
  competitors,
  typed,
}: {
  run: AuditRun | undefined;
  brand: string;
  competitors: string[];
  typed: string | null;
}) {
  const full = run?.response ?? "Sem dados.";
  const text = typed ?? full.slice(0, 240);
  const segs = highlight(text, brand, competitors);
  return (
    <span className="la-excerpt">
      {segs.map((s, i) =>
        s.kind ? (
          <span key={i} className={`la-cite ${s.kind === "you" ? "you" : ""}`}>
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
      {typed !== null && typed.length < full.slice(0, 240).length && (
        <span className="caret">▍</span>
      )}
    </span>
  );
}

function useTyping(full: string, active: boolean) {
  const [state, setState] = useState<{ text: string; shown: number }>({ text: "", shown: 0 });
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const target = full.slice(0, 240);
    const step = Math.max(1, Math.round(target.length / 60));
    const id = setInterval(() => {
      i = Math.min(i + step, target.length);
      setState({ text: full, shown: i });
      if (i >= target.length) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, [full, active]);
  return state.text === full ? full.slice(0, state.shown) : "";
}

export function LiveAudit({ deck, active, page = 0, pageCount = 1 }: SlideProps) {
  const brand = deck.companyName;
  const competitors = deck.competitors;

  const runOf = useMemo(() => {
    const map = new Map<string, AuditRun>();
    for (const r of deck.auditRuns) map.set(`${r.prompt}|${r.engine}`, r);
    return (prompt: string, engine: Engine) => map.get(`${prompt}|${engine}`);
  }, [deck.auditRuns]);

  const enginesFor = (prompt: string): Engine[] =>
    ENGINES.filter((engine) => {
      const r = runOf(prompt, engine);
      return r?.response && r.brand_present !== null;
    });

  const bestEngineFor = (prompt: string): Engine | undefined => {
    const engines = enginesFor(prompt);
    const withPresent = engines.find((e) => runOf(prompt, e)?.brand_present);
    if (withPresent) return withPresent;
    return engines.sort(
      (a, b) =>
        (runOf(prompt, b)?.response?.length ?? 0) - (runOf(prompt, a)?.response?.length ?? 0),
    )[0];
  };

  // Paginação: todos os prompts com dados, fatiados em páginas de 3.
  const withData = deck.prompts.filter((p) => enginesFor(p).length > 0);
  const pageStart = page * PROMPTS_PER_PAGE;
  const prompts = withData.slice(pageStart, pageStart + PROMPTS_PER_PAGE);

  const firstPrompt = prompts[0];
  const firstEngine = firstPrompt ? bestEngineFor(firstPrompt) : undefined;
  const firstRun = firstPrompt && firstEngine ? runOf(firstPrompt, firstEngine) : undefined;
  const typedFirst = useTyping(firstRun?.response ?? "", active);

  return (
    <div className="slide" data-tone="paper">
      <div className="slide__inner slide__inner--audit">
        <div className="slide__eyebrow" style={{ marginBottom: 16 }}>
          <span className="num">Auditoria{pageCount > 1 ? ` ${page + 1}/${pageCount}` : ""}</span>
          <span className="bar" />
          <span>Auditoria personalizada · {brand}</span>
        </div>

        <div className="la-scroll">
          {prompts.map((prompt, pi) => {
            const engines = enginesFor(prompt);
            const bestEngine = bestEngineFor(prompt);
            const bestRun = bestEngine ? runOf(prompt, bestEngine) : undefined;
            return (
              <motion.div
                className="la-card"
                key={pi}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
                transition={{ duration: 0.45, delay: 0.1 + pi * 0.08 }}
              >
                <div className="la-card__head">
                  <span className="la-card__n">
                    PROMPT {String(pageStart + pi + 1).padStart(2, "0")}
                  </span>
                  <span className="la-card__prompt">{prompt}</span>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {bestRun && bestEngine && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono-jetbrains)",
                            fontSize: 10,
                            letterSpacing: "0.06em",
                            color: "var(--ink-2)",
                          }}
                        >
                          {ENGINE_LABEL[bestEngine]}
                        </span>
                        <span
                          className={`la-flag ${bestRun.brand_present ? "is-present" : "is-absent"}`}
                        >
                          {bestRun.brand_present ? "PRESENTE" : "AUSENTE"}
                        </span>
                      </div>
                      <Excerpt
                        run={bestRun}
                        brand={brand}
                        competitors={competitors}
                        typed={pi === 0 ? typedFirst : null}
                      />
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      paddingTop: 8,
                      borderTop: "1px solid var(--rule-soft)",
                      fontSize: 10,
                      fontFamily: "var(--font-mono-jetbrains)",
                      color: "var(--ink-3)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {engines.map((engine) => {
                      const present = runOf(prompt, engine)?.brand_present;
                      return (
                        <span
                          key={engine}
                          style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
                        >
                          {ENGINE_LABEL[engine]}
                          <span
                            style={{
                              color: present ? "var(--status-active)" : "var(--red)",
                              fontWeight: 600,
                            }}
                          >
                            {present ? "✓" : "✗"}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
