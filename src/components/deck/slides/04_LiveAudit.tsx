"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SlideProps, DeckData } from "../types";
import { ENGINES, ENGINE_LABEL, type Engine } from "@/lib/llm/models";
import type { AuditRun } from "@/lib/supabase/types";

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

/** Slide 04 é agora invertido (0% herói + 2 prompts) numa só página.
 * Os prompts completos vão para o Apêndice A. Sempre 1 página. */
export function liveAuditPageCount(deck: DeckData): number {
  return liveAuditPrompts(deck).length > 0 ? 1 : 0;
}

/** Todos os prompts auditados (para o Apêndice A). */
export function allAuditedPrompts(deck: DeckData): string[] {
  return liveAuditPrompts(deck);
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

export function LiveAudit({ deck, active }: SlideProps) {
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

  // Invertido (P2 #9): 0% é o herói; 2 prompts representativos como prova.
  // Os prompts completos vivem no Apêndice A.
  const withData = deck.prompts.filter((p) => enginesFor(p).length > 0);
  const shown = withData.slice(0, 2);
  const s = deck.audit?.summary;
  const citePct = s ? Math.round(s.citation_rate * 100) : 0;
  const sovPct = s ? Math.round(s.share_of_voice * 100) : 0;

  const firstPrompt = shown[0];
  const firstEngine = firstPrompt ? bestEngineFor(firstPrompt) : undefined;
  const firstRun = firstPrompt && firstEngine ? runOf(firstPrompt, firstEngine) : undefined;
  const typedFirst = useTyping(firstRun?.response ?? "", active);

  const HERO: Array<{ label: string; value: string }> = [
    { label: "Taxa de citação", value: `${citePct}%` },
    { label: "Share of voice", value: `${sovPct}%` },
    { label: "Posição média", value: s?.avg_position != null ? `#${s.avg_position}` : "—" },
  ];

  return (
    <div className="slide" data-tone="paper">
      <div className="slide__inner slide__inner--audit">
        <div className="slide__eyebrow" style={{ marginBottom: 20 }}>
          <span className="num">Auditoria personalizada</span>
          <span className="bar" />
          <span>{brand}</span>
        </div>

        <h2 className="tx-h2" style={{ marginBottom: 28 }}>
          O que a IA diz sobre ti, <em className="mark">hoje</em>.
        </h2>

        {/* Herói: 0% grande */}
        <div className="la-hero">
          {HERO.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              <div className="kpi__label">{h.label}</div>
              <div className="la-hero__v">{h.value}</div>
            </motion.div>
          ))}
        </div>

        {/* 2 prompts representativos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 980 }}>
          {shown.map((prompt, pi) => {
            const bestEngine = bestEngineFor(prompt);
            const bestRun = bestEngine ? runOf(prompt, bestEngine) : undefined;
            return (
              <div
                key={pi}
                style={{ borderTop: "1px solid var(--rule-soft)", paddingTop: 12 }}
              >
                <div
                  className="la-card__prompt"
                  style={{ fontSize: 15, marginBottom: 6, color: "var(--ink)" }}
                >
                  «{prompt}»
                </div>
                {bestRun && bestEngine && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      className={`la-flag ${bestRun.brand_present ? "is-present" : "is-absent"}`}
                    >
                      {bestRun.brand_present ? "PRESENTE" : "AUSENTE"}
                    </span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)" }}>
                      <Excerpt
                        run={bestRun}
                        brand={brand}
                        competitors={competitors}
                        typed={pi === 0 ? typedFirst : null}
                      />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 28, fontSize: 14, color: "var(--ink-3)", maxWidth: 820 }}>
          Auditámos os prompts que decidem a tua categoria. Não apareces em nenhum.{" "}
          <span style={{ color: "var(--ink-2)" }}>
            ({withData.length} prompts completos no Apêndice A.)
          </span>
        </p>
      </div>
    </div>
  );
}
