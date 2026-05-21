"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideDef, SlideProps } from "../types";
import { Slide04LiveAudit } from "./Slide04LiveAudit";
import { ENGINES, ENGINE_LABEL } from "@/lib/llm/models";
import { eur, pct } from "@/lib/utils/format";

const TOTAL = 18;

/* ---------------- 01 · Capa ---------------- */
function SlideCover({ deck }: SlideProps) {
  return (
    <div className="slide" data-tone="paper">
      <div className="slide__inner slide__inner--center">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="num">PROPOSTA</span>
          <span className="bar" />
          <span>destaque.ai · Generative Engine Optimization</span>
        </motion.div>
        <motion.h1
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 900 }}
        >
          {deck.customMessage?.trim() || `Proposta para ${deck.companyName}`}
        </motion.h1>
        <motion.p
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ marginTop: 24, maxWidth: 560 }}
        >
          Tornar a <em className="mark">{deck.companyName}</em> citável pelos motores de
          IA que o teu mercado já usa para decidir.
        </motion.p>
      </div>
    </div>
  );
}

/* ---------------- 02 · O problema ---------------- */
function SlideProblem({ deck }: SlideProps) {
  return (
    <SlideShell index={2} total={TOTAL} eyebrow="O problema" tone="ink">
      <h2 className="tx-display" style={{ maxWidth: 920 }}>
        O ChatGPT recomenda <em className="mark">alguém</em>.
        <br />
        Hoje, não é a {deck.companyName}.
      </h2>
      <p className="lead" style={{ marginTop: 28, maxWidth: 600, color: "var(--ink-4)" }}>
        Quando o teu público pergunta a uma IA por um serviço como o teu, há uma resposta.
        Essa resposta tem nomes. A questão é se um deles é o teu.
      </p>
    </SlideShell>
  );
}

/* ---------------- 03 · Como funciona a auditoria ---------------- */
function SlideAuditIntro({ deck }: SlideProps) {
  return (
    <SlideShell index={3} total={TOTAL} eyebrow="Método">
      <h2 className="tx-h2" style={{ maxWidth: 760, marginBottom: 24 }}>
        Medimos a tua visibilidade com <em className="mark">prompts reais</em>
      </h2>
      <div className="feature-grid">
        {[
          { n: "5", l: "prompts", d: "perguntas que o teu público faz mesmo" },
          { n: "4", l: "motores", d: "ChatGPT · Claude · Gemini · Perplexity" },
          { n: "20", l: "respostas", d: "analisadas marca a marca" },
        ].map((f) => (
          <div key={f.l} className="feature">
            <span className="feature__n">{f.n}</span>
            <span className="feature__l">{f.l}</span>
            <span className="feature__d">{f.d}</span>
          </div>
        ))}
      </div>
      <p className="body-m" style={{ color: "var(--ink-3)", marginTop: 24 }}>
        Negócio auditado: <b>{deck.businessType ?? "—"}</b>
        {deck.location ? ` · ${deck.location}` : ""}
      </p>
    </SlideShell>
  );
}

/* ---------------- 05 · Resultados por motor ---------------- */
function SlideByEngine({ deck }: SlideProps) {
  const byEngine = deck.audit?.by_engine;
  return (
    <SlideShell index={5} total={TOTAL} eyebrow="Resultados" tone="ink">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Taxa de citação <em className="mark">por motor</em>
      </h2>
      <div className="engine-grid">
        {ENGINES.map((e) => {
          const s = byEngine?.[e];
          const rate = s ? Math.round(s.citation_rate * 100) : 0;
          return (
            <div key={e} className="engine-card">
              <span className="engine-card__name">{ENGINE_LABEL[e]}</span>
              <span className="engine-card__pct">
                {rate}
                <sup>%</sup>
              </span>
              <span className="engine-card__meta">
                SoV {s ? pct(s.share_of_voice) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}

/* ---------------- 06 · Share of voice ---------------- */
function SlideShareOfVoice({ deck }: SlideProps) {
  const sov = deck.audit?.summary.share_of_voice ?? 0;
  return (
    <SlideShell index={6} total={TOTAL} eyebrow="Share of voice">
      <h2 className="tx-h2" style={{ marginBottom: 24 }}>
        A tua fatia da <em className="mark">conversa</em>
      </h2>
      <div className="sov-bar">
        <div className="sov-bar__fill" style={{ width: `${Math.round(sov * 100)}%` }}>
          <span>{deck.companyName}</span>
        </div>
        <div className="sov-bar__rest">
          <span>Concorrentes</span>
        </div>
      </div>
      <p className="lead" style={{ marginTop: 28, maxWidth: 560 }}>
        Hoje ocupas <em className="mark">{pct(sov)}</em> das menções. O resto é espaço por
        conquistar.
      </p>
    </SlideShell>
  );
}

/* ---------------- 07 · Concorrentes ---------------- */
function SlideCompetitors({ deck }: SlideProps) {
  const tops = deck.audit?.summary.top_competitors ?? deck.competitors;
  return (
    <SlideShell index={7} total={TOTAL} eyebrow="Concorrência">
      <h2 className="tx-h2" style={{ marginBottom: 24 }}>
        Quem a IA <em className="mark">cita primeiro</em>
      </h2>
      <ol className="rank-list">
        {(tops.length ? tops : ["—"]).slice(0, 5).map((c, i) => (
          <li key={i}>
            <span className="rank-list__n">{String(i + 1).padStart(2, "0")}</span>
            <span className="rank-list__name">{c}</span>
          </li>
        ))}
      </ol>
    </SlideShell>
  );
}

/* ---------------- 08 · Diagnóstico ---------------- */
function SlideDiagnosis({ deck }: SlideProps) {
  const rate = deck.audit?.summary.citation_rate ?? 0;
  return (
    <SlideShell index={8} total={TOTAL} eyebrow="Diagnóstico" tone="ink">
      <h2 className="tx-display" style={{ maxWidth: 880 }}>
        Estás citado em <em className="mark">{pct(rate)}</em> das respostas.
      </h2>
      <p className="lead" style={{ marginTop: 24, maxWidth: 560, color: "var(--ink-4)" }}>
        Não é um problema de qualidade. É um problema de estrutura — a IA não te encontra,
        não te entende, ou não confia em ti o suficiente para te citar.
      </p>
    </SlideShell>
  );
}

/* ---------------- Slide de conteúdo genérico ---------------- */
function ContentSlide({
  index,
  eyebrow,
  title,
  lead,
  bullets,
  tone = "paper",
}: {
  index: number;
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  bullets?: { h: string; d: string }[];
  tone?: "paper" | "ink";
}) {
  return (
    <SlideShell index={index} total={TOTAL} eyebrow={eyebrow} tone={tone}>
      <h2 className="tx-h2" style={{ maxWidth: 820, marginBottom: lead ? 16 : 28 }}>
        {title}
      </h2>
      {lead && (
        <p className="lead" style={{ maxWidth: 600, marginBottom: 28 }}>
          {lead}
        </p>
      )}
      {bullets && (
        <ul className="deck-list">
          {bullets.map((b) => (
            <li key={b.h}>
              <b>{b.h}</b>
              <span>{b.d}</span>
            </li>
          ))}
        </ul>
      )}
    </SlideShell>
  );
}

/* ---------------- 15 · Pricing ---------------- */
function SlidePricing({ deck }: SlideProps) {
  const tiers = [
    {
      name: "Diagnóstico",
      price: eur(deck.pricing.diagnostico),
      unit: "one-off",
      d: "Auditoria completa + roadmap priorizado.",
    },
    {
      name: "Sprint",
      price: eur(deck.pricing.sprint),
      unit: "one-off",
      d: "Implementação técnica e editorial.",
      featured: true,
    },
    {
      name: "Retainer",
      price: eur(deck.pricing.retainer),
      unit: "/ mês",
      d: "Monitorização e operação contínua.",
    },
  ];
  return (
    <SlideShell index={15} total={TOTAL} eyebrow="Investimento" tone="ink">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Três fases, <em className="mark">um número claro</em>
      </h2>
      <div className="pricing-grid">
        {tiers.map((t) => (
          <div key={t.name} className={`pricing-card${t.featured ? " is-featured" : ""}`}>
            <span className="pricing-card__name">{t.name}</span>
            <span className="pricing-card__price">{t.price}</span>
            <span className="pricing-card__unit">{t.unit}</span>
            <span className="pricing-card__d">{t.d}</span>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ---------------- 18 · CTA ---------------- */
function SlideCTA({ deck }: SlideProps) {
  return (
    <div className="slide" data-tone="ink">
      <div className="slide__inner slide__inner--center">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="num">18 / 18</span>
          <span className="bar" />
          <span>Próximo passo</span>
        </motion.div>
        <motion.h2
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 880 }}
        >
          Vamos pôr a {deck.companyName} <em className="mark">no mapa</em> da IA.
        </motion.h2>
        <motion.a
          className="btn-big"
          href={`/proposta/${deck.token}/agendar`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{ marginTop: 32 }}
        >
          <span>Agendar conversa · 30 min</span>
          <span className="arrow">→</span>
        </motion.a>
      </div>
    </div>
  );
}

/* ---------------- Wrappers de conteúdo ---------------- */
const SlideGEO = () => (
  <ContentSlide
    index={9}
    eyebrow="Contexto"
    title={<>O que é <em className="mark">GEO</em></>}
    lead="Generative Engine Optimization é o conjunto de práticas que torna uma marca citável por modelos de IA generativa — o equivalente ao SEO para a era das respostas."
    bullets={[
      { h: "Estrutura", d: "Schema, dados estruturados, conteúdo extraível." },
      { h: "Autoridade", d: "Sinais externos que a IA usa para confiar." },
      { h: "Infraestrutura", d: "llms.txt, ai.txt e o que vier a seguir." },
    ]}
  />
);

const SlideMethod = () => (
  <ContentSlide
    index={10}
    eyebrow="Metodologia"
    tone="ink"
    title={<>Três fases, <em className="mark">sem improviso</em></>}
    bullets={[
      { h: "01 · Diagnóstico", d: "Onde estás e porquê. 2 semanas." },
      { h: "02 · Sprint", d: "Implementação técnica e editorial. 6 semanas." },
      { h: "03 · Retainer", d: "Operação e monitorização contínua." },
    ]}
  />
);

const SlidePhase1 = () => (
  <ContentSlide
    index={11}
    eyebrow="Fase 01"
    title={<>Diagnóstico — <em className="mark">o mapa</em></>}
    lead="Auditoria completa da tua presença nos quatro motores, benchmark competitivo e um roadmap priorizado por impacto."
    bullets={[
      { h: "Auditoria GEO", d: "20 respostas analisadas marca a marca." },
      { h: "Benchmark", d: "A tua posição vs. concorrência directa." },
      { h: "Roadmap", d: "Ações ordenadas por esforço e retorno." },
    ]}
  />
);

const SlidePhase2 = () => (
  <ContentSlide
    index={12}
    eyebrow="Fase 02"
    title={<>Sprint — <em className="mark">a execução</em></>}
    lead="Implementação técnica e editorial do roadmap. Schema, conteúdo extraível, infraestrutura e autoridade."
    bullets={[
      { h: "Técnico", d: "Schema.org, llms.txt, dados estruturados." },
      { h: "Editorial", d: "Conteúdo que a IA consegue citar." },
      { h: "Autoridade", d: "Sinais externos e presença distribuída." },
    ]}
  />
);

const SlidePhase3 = () => (
  <ContentSlide
    index={13}
    eyebrow="Fase 03"
    title={<>Retainer — <em className="mark">a operação</em></>}
    lead="A visibilidade em IA não é um projecto, é um estado. Monitorizamos, ajustamos e reportamos todos os meses."
    bullets={[
      { h: "Monitorização", d: "Tracking contínuo nos 4 motores." },
      { h: "Iteração", d: "Ajustes conforme os modelos evoluem." },
      { h: "Relatório", d: "Dashboard e report consolidado mensal." },
    ]}
  />
);

const SlideTimeline = () => (
  <ContentSlide
    index={14}
    eyebrow="Calendário"
    tone="ink"
    title={<>Do <em className="mark">diagnóstico</em> ao resultado</>}
    bullets={[
      { h: "Semanas 1-2", d: "Diagnóstico e roadmap." },
      { h: "Semanas 3-8", d: "Sprint de implementação." },
      { h: "Mês 3+", d: "Retainer — primeiros resultados visíveis." },
    ]}
  />
);

const SlideWhyUs = () => (
  <ContentSlide
    index={16}
    eyebrow="Porquê nós"
    title={<>Método <em className="mark">auditável</em>, não promessas</>}
    bullets={[
      { h: "Especialistas em GEO", d: "É só nisto que trabalhamos." },
      { h: "Responsáveis pelo número", d: "Medimos e respondemos pelo resultado." },
      { h: "Sem lock-in", d: "Ficas com o trabalho técnico implementado." },
    ]}
  />
);

const SlideNextSteps = () => (
  <ContentSlide
    index={17}
    eyebrow="A seguir"
    title={<>O que acontece <em className="mark">a partir daqui</em></>}
    bullets={[
      { h: "01", d: "Conversa de 30 minutos para alinhar contexto." },
      { h: "02", d: "Confirmação de âmbito e arranque do diagnóstico." },
      { h: "03", d: "Primeiro roadmap em 2 semanas." },
    ]}
  />
);

/* ---------------- Registry ---------------- */
export const SLIDES: SlideDef[] = [
  { id: "cover", title: "Capa", tone: "paper", Component: SlideCover },
  { id: "problem", title: "O problema", tone: "ink", Component: SlideProblem },
  { id: "audit-intro", title: "Método", tone: "paper", Component: SlideAuditIntro },
  { id: "live-audit", title: "Auditoria ao vivo", tone: "paper", Component: Slide04LiveAudit },
  { id: "by-engine", title: "Por motor", tone: "ink", Component: SlideByEngine },
  { id: "share-of-voice", title: "Share of voice", tone: "paper", Component: SlideShareOfVoice },
  { id: "competitors", title: "Concorrentes", tone: "paper", Component: SlideCompetitors },
  { id: "diagnosis", title: "Diagnóstico", tone: "ink", Component: SlideDiagnosis },
  { id: "geo", title: "O que é GEO", tone: "paper", Component: SlideGEO },
  { id: "method", title: "Metodologia", tone: "ink", Component: SlideMethod },
  { id: "phase-1", title: "Fase 1", tone: "paper", Component: SlidePhase1 },
  { id: "phase-2", title: "Fase 2", tone: "paper", Component: SlidePhase2 },
  { id: "phase-3", title: "Fase 3", tone: "paper", Component: SlidePhase3 },
  { id: "timeline", title: "Timeline", tone: "ink", Component: SlideTimeline },
  { id: "pricing", title: "Pricing", tone: "ink", Component: SlidePricing },
  { id: "why-us", title: "Porquê nós", tone: "paper", Component: SlideWhyUs },
  { id: "next-steps", title: "Próximos passos", tone: "paper", Component: SlideNextSteps },
  { id: "cta", title: "Agendar", tone: "ink", Component: SlideCTA },
];
