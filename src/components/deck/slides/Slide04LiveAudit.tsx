"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { ENGINES, ENGINE_LABEL, type Engine } from "@/lib/llm/models";
import type { AuditRun } from "@/lib/supabase/types";

const TOTAL = 18;

/** Realça a marca e os concorrentes no texto da resposta. */
function highlight(text: string, brand: string, competitors: string[]) {
  const terms: { term: string; kind: "you" | "comp" }[] = [];
  if (brand.trim().length > 1) terms.push({ term: brand, kind: "you" });
  for (const c of competitors) {
    if (c.trim().length > 1) terms.push({ term: c, kind: "comp" });
  }
  if (terms.length === 0) return [{ text, kind: null as null | "you" | "comp" }];

  const escaped = terms
    .map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(re);
  return parts.map((part) => {
    const match = terms.find((t) => t.term.toLowerCase() === part.toLowerCase());
    return { text: part, kind: match?.kind ?? null };
  });
}

function useTyping(full: string, active: boolean) {
  // Guarda o texto a que `shown` pertence — assim o reset ao mudar de prompt
  // é derivado (não há setState síncrono dentro do efeito).
  const [state, setState] = useState<{ text: string; shown: number }>({
    text: "",
    shown: 0,
  });
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const step = Math.max(1, Math.round(full.length / 90));
    const id = setInterval(() => {
      i = Math.min(i + step, full.length);
      setState({ text: full, shown: i });
      if (i >= full.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [full, active]);

  const shown = state.text === full ? state.shown : 0;
  // Slide inactivo mostra o texto completo; activo revela progressivamente.
  return active ? full.slice(0, shown) : full;
}

export function Slide04LiveAudit({ deck, active }: SlideProps) {
  const prompts = deck.prompts.length ? deck.prompts : ["(sem prompts)"];
  const [promptIdx, setPromptIdx] = useState(0);
  const [engine, setEngine] = useState<Engine>("chatgpt");

  const prompt = prompts[Math.min(promptIdx, prompts.length - 1)];

  const run: AuditRun | undefined = useMemo(
    () => deck.auditRuns.find((r) => r.prompt === prompt && r.engine === engine),
    [deck.auditRuns, prompt, engine],
  );

  const responseText = run?.response ?? "Sem dados de auditoria para este prompt.";
  const typed = useTyping(responseText, active);
  const segments = highlight(typed, deck.companyName, deck.competitors);

  const present = run?.brand_present ?? false;
  const summary = deck.audit?.summary;

  return (
    <SlideShell index={4} total={TOTAL} eyebrow="Auditoria ao vivo">
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        O que a IA diz quando perguntam por <em className="mark">{deck.businessType ?? "este serviço"}</em>
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 20, maxWidth: 620 }}>
        Cinco perguntas reais do teu público-alvo, corridas em quatro motores de IA. Sem
        retoques.
      </p>

      <div className="audit-grid">
        {/* Selector de prompts */}
        <div className="audit-prompts">
          {prompts.map((p, i) => (
            <button
              key={i}
              type="button"
              className={`audit-prompt${i === promptIdx ? " is-active" : ""}`}
              onClick={() => setPromptIdx(i)}
            >
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="t">{p}</span>
            </button>
          ))}
        </div>

        {/* Card de resposta */}
        <div className="llm-card">
          <div className="llm-card__chrome">
            <div className="llm-card__tabs">
              {ENGINES.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`llm-card__tab${e === engine ? " active" : ""}`}
                  onClick={() => setEngine(e)}
                >
                  {ENGINE_LABEL[e]}
                </button>
              ))}
            </div>
            <span
              className={`audit-badge${present ? " is-present" : " is-absent"}`}
            >
              {present ? "● Citada" : "○ Ausente"}
            </span>
          </div>
          <div className="llm-card__body">
            <div className="llm-prompt">
              Prompt: <b>{prompt}</b>
            </div>
            <p className="llm-response">
              {segments.map((seg, i) =>
                seg.kind ? (
                  <span key={i} className={`llm-cite ${seg.kind === "you" ? "you" : ""}`}>
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
              {typed.length < responseText.length && <span className="caret">▍</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard summary */}
      {summary && (
        <motion.div
          className="audit-summary"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="audit-stat">
            <span className="audit-stat__label">Taxa de citação</span>
            <span className="audit-stat__value">
              {Math.round(summary.citation_rate * 100)}<sup>%</sup>
            </span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat__label">Share of voice</span>
            <span className="audit-stat__value">
              {Math.round(summary.share_of_voice * 100)}<sup>%</sup>
            </span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat__label">Posição média</span>
            <span className="audit-stat__value">
              {summary.avg_position != null ? `#${summary.avg_position}` : "—"}
            </span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat__label">Top concorrente</span>
            <span className="audit-stat__value sm">
              {summary.top_competitors[0] ?? "—"}
            </span>
          </div>
        </motion.div>
      )}
    </SlideShell>
  );
}
