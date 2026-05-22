"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SlideProps } from "../types";
import { ENGINES, ENGINE_LABEL, type Engine } from "@/lib/llm/models";
import type { AuditRun } from "@/lib/supabase/types";

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
  const text = typed ?? full.slice(0, 150);
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
      {typed !== null && typed.length < full.slice(0, 150).length && (
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
    const target = full.slice(0, 150);
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
  const prompts = deck.prompts.length ? deck.prompts : ["(sem prompts)"];
  const brand = deck.companyName;
  const competitors = deck.competitors;

  const runOf = useMemo(() => {
    const map = new Map<string, AuditRun>();
    for (const r of deck.auditRuns) map.set(`${r.prompt}|${r.engine}`, r);
    return (prompt: string, engine: Engine) => map.get(`${prompt}|${engine}`);
  }, [deck.auditRuns]);

  // Typing apenas no primeiro motor do primeiro prompt.
  const firstRun = runOf(prompts[0], "chatgpt");
  const typedFirst = useTyping(firstRun?.response ?? "", active);

  const summary = deck.audit?.summary;

  return (
    <div className="slide" data-tone="paper">
      <div className="slide__inner slide__inner--audit">
        <div className="slide__eyebrow" style={{ marginBottom: 16 }}>
          <span className="num">04 / 18</span>
          <span className="bar" />
          <span>Auditoria personalizada · {brand}</span>
        </div>

        <div className="la-scroll">
          {prompts.map((prompt, pi) => (
            <motion.div
              className="la-card"
              key={pi}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
              transition={{ duration: 0.45, delay: 0.1 + pi * 0.08 }}
            >
              <div className="la-card__head">
                <span className="la-card__n">PROMPT {String(pi + 1).padStart(2, "0")}</span>
                <span className="la-card__prompt">{prompt}</span>
              </div>
              <div className="la-engines">
                {ENGINES.map((engine) => {
                  const run = runOf(prompt, engine);
                  const present = run?.brand_present ?? false;
                  const isTyping = pi === 0 && engine === "chatgpt";
                  return (
                    <div className="la-engine" key={engine}>
                      <div className="la-engine__top">
                        <span className="la-engine__name">{ENGINE_LABEL[engine]}</span>
                        <span
                          className={`la-flag ${present ? "is-present" : "is-absent"}`}
                        >
                          {present ? "PRESENTE" : "AUSENTE"}
                        </span>
                      </div>
                      <Excerpt
                        run={run}
                        brand={brand}
                        competitors={competitors}
                        typed={isTyping ? typedFirst : null}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Mini-KPIs */}
          <motion.div
            className="la-kpis"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="la-kpi">
              <span className="la-kpi__label">Citation rate</span>
              <span className="la-kpi__value">
                {summary ? Math.round(summary.citation_rate * 100) : 0}
                <sup>%</sup>
              </span>
            </div>
            <div className="la-kpi">
              <span className="la-kpi__label">Share of voice</span>
              <span className="la-kpi__value">
                {summary ? Math.round(summary.share_of_voice * 100) : 0}
                <sup>%</sup>
              </span>
            </div>
            <div className="la-kpi">
              <span className="la-kpi__label">Posição média</span>
              <span className="la-kpi__value">
                {summary?.avg_position != null ? summary.avg_position : "—"}
              </span>
            </div>
            <div className="la-kpi">
              <span className="la-kpi__label">Top concorrentes</span>
              <span className="la-kpi__list">
                {(summary?.top_competitors ?? []).slice(0, 3).map((c, i) => (
                  <span key={i}>{c}</span>
                ))}
                {(summary?.top_competitors ?? []).length === 0 && <span>—</span>}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
