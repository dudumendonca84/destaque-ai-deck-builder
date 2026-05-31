import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import type { DeckData } from "@/components/deck/types";
import { eur, eurOrPlaceholder, pct } from "@/lib/utils/format";
import { ENGINE_COUNT } from "@/lib/llm/models";
import { findBenchmark } from "@/lib/skill/benchmarks";

// Regista as fontes da marca para o PDF não cair em Times/Helvetica.
// Ficheiros .woff bundlados em public/fonts (react-pdf lê woff; woff2 não).
// Lidos do filesystem (sem fetch em runtime); public/ está no deploy Vercel
// e process.cwd() aponta para a raiz do projecto.
const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const woff = (f: string) => path.join(FONT_DIR, f);
try {
  if (fs.existsSync(woff("inter-latin-400-normal.woff"))) {
    Font.register({
      family: "Fraunces",
      fonts: [{ src: woff("fraunces-latin-600-normal.woff"), fontWeight: 600 }],
    });
    Font.register({
      family: "FrauncesItalic",
      fonts: [{ src: woff("fraunces-latin-600-italic.woff"), fontWeight: 600 }],
    });
    Font.register({
      family: "Inter",
      fonts: [
        { src: woff("inter-latin-400-normal.woff"), fontWeight: 400 },
        { src: woff("inter-latin-500-normal.woff"), fontWeight: 500 },
      ],
    });
    Font.register({
      family: "InterSemiBold",
      fonts: [{ src: woff("inter-latin-600-normal.woff"), fontWeight: 600 }],
    });
    Font.register({
      family: "Geist",
      fonts: [{ src: woff("geist-latin-600-normal.woff"), fontWeight: 600 }],
    });
    Font.registerHyphenationCallback((w) => [w]);
  }
} catch {
  // Se faltar algum ficheiro, react-pdf cai nas built-in — o PDF ainda
  // gera (Helvetica/Times). Não bloqueia o download.
}

// Famílias da marca (com fallback implícito para built-in se o register
// acima não correr). Headlines Fraunces; corpo Inter.
const HAS_BRAND_FONTS = (() => {
  try {
    return fs.existsSync(woff("inter-latin-400-normal.woff"));
  } catch {
    return false;
  }
})();

// Paleta da marca.
const CREAM = "#F5F1E8";
const INK = "#0A0A0A";
const AMBER = "#FACC15";
const INK2 = "#1A1A1A";
const INK3 = "#6B6355";
const INK4 = "#999999";
const RULE = "#D4CFC0";
const PAPER2 = "#FFFFFF";

// Famílias: Fraunces (headlines) + Inter (corpo). Fallback built-in
// (Times/Helvetica) se as fontes da marca não estiverem disponíveis.
const SERIF = HAS_BRAND_FONTS ? "Fraunces" : "Times-Roman";
const SERIF_I = HAS_BRAND_FONTS ? "FrauncesItalic" : "Times-Italic";
const SANS = HAS_BRAND_FONTS ? "Inter" : "Helvetica";
const SANS_B = HAS_BRAND_FONTS ? "InterSemiBold" : "Helvetica-Bold";

// Total de páginas do deck. Centralizado para os rodapés "NN / TOTAL".
const TOTAL = 21;

// URL do estudo próprio citado no slide da prova (B4).
const STUDY_URL = "https://destaque.ai/estudo/visibilidade-ia-saas-portugal-2026";

/**
 * Plataformas conhecidas de tracking/medição GEO. Quando a marca mais
 * citada na categoria é uma destas, o card do "ponto de partida" muda o
 * rótulo — evita apresentar uma ferramenta como consultora concorrente.
 * Espelha `GEO_TOOLS` em components/deck/slides/10_KPIs.tsx (B2).
 */
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

/**
 * Normaliza pontuação fora do subset latino das fontes .woff embebidas
 * (Inter/Fraunces) para equivalentes seguros. Sem isto, glifos como `→`
 * (presente em dados da skill, ex: "36% → 82%") caem para Helvetica e
 * renderizam como lixo. O deck web não precisa — usa Inter completo via
 * next/font. Aqui sanitizamos só os campos dinâmicos vindos da skill/DB.
 */
const GLYPH_MAP: Array<[RegExp, string]> = [
  [/[→➜➔➙➡➙]/g, "—"], // setas → em-dash (no subset)
  [/[←]/g, "—"], // seta esquerda
  [/[‘’‛]/g, "'"], // aspas simples curvas → recta
  [/[“”‟]/g, '"'], // aspas duplas curvas → recta
  [/…/g, "..."], // reticências
  [/[   ]/g, " "], // espaços estreitos/insecáveis
];

function san(input: string): string {
  let out = input;
  for (const [re, rep] of GLYPH_MAP) out = out.replace(re, rep);
  return out;
}

const s = StyleSheet.create({
  page: { backgroundColor: CREAM, padding: 56, fontFamily: SANS, color: INK },
  pageInk: { backgroundColor: INK, padding: 56, fontFamily: SANS, color: CREAM },
  accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 10, backgroundColor: AMBER },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },
  eyebrowText: {
    fontFamily: SANS,
    fontSize: 9,
    letterSpacing: 2,
    color: INK3,
  },
  eyebrowTextInk: {
    fontFamily: SANS,
    fontSize: 9,
    letterSpacing: 2,
    color: INK4,
  },
  eyebrowLine: { flex: 1, height: 1, backgroundColor: RULE, marginLeft: 14 },
  eyebrowLineInk: { flex: 1, height: 1, backgroundColor: "#2A2A2A", marginLeft: 14 },

  h1: { fontFamily: SERIF, fontSize: 46, lineHeight: 1.1, letterSpacing: -1 },
  h2: { fontFamily: SERIF, fontSize: 30, lineHeight: 1.15, letterSpacing: -0.5 },
  lead: { fontFamily: SERIF, fontSize: 16, lineHeight: 1.45, color: INK2, marginTop: 16 },
  leadInk: { fontFamily: SERIF, fontSize: 15, lineHeight: 1.5, color: INK4, marginTop: 18 },
  body: { fontFamily: SANS, fontSize: 11, lineHeight: 1.5, color: INK3 },

  mark: { backgroundColor: AMBER, color: INK, fontFamily: SERIF_I },

  center: { flex: 1, justifyContent: "center" },

  // grids
  row: { flexDirection: "row" },
  statCol: { flex: 1, paddingRight: 22 },
  statValue: { fontFamily: SERIF, fontSize: 58, color: INK, letterSpacing: -2 },
  statLabel: { fontFamily: SANS, fontSize: 10, color: INK3, marginTop: 8, lineHeight: 1.4 },

  card: {
    flex: 1,
    backgroundColor: PAPER2,
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 8,
    padding: 18,
    marginRight: 12,
  },
  cardLabel: { fontFamily: SANS, fontSize: 8, letterSpacing: 1, color: INK3 },
  cardValue: { fontFamily: SERIF, fontSize: 30, color: INK, marginTop: 6 },
  cardNote: { fontFamily: SANS, fontSize: 9, color: INK3, marginTop: 6, lineHeight: 1.4 },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontFamily: SANS, fontSize: 8, color: INK4, letterSpacing: 1 },
});

function Eyebrow({ num, label, ink }: { num: string; label: string; ink?: boolean }) {
  return (
    <View style={s.eyebrow}>
      <Text style={ink ? s.eyebrowTextInk : s.eyebrowText}>
        {num.toUpperCase()}   {label.toUpperCase()}
      </Text>
      <View style={ink ? s.eyebrowLineInk : s.eyebrowLine} />
    </View>
  );
}

function Foot({ n }: { n: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>DESTAQUE.AI</Text>
      <Text style={s.footerText}>{`${String(n).padStart(2, "0")} / ${TOTAL}`}</Text>
    </View>
  );
}

/** Palavra-chave realçada a amarelo (equivalente ao .mark do deck web). */
function Mark({ children }: { children: string }) {
  return <Text style={s.mark}>{children}</Text>;
}

/** Página de conteúdo (fundo creme). */
function ContentPage({
  n,
  eyebrow,
  children,
}: {
  n: number;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <Page size={[960, 540]} style={s.page}>
      <Eyebrow num={String(n).padStart(2, "0")} label={eyebrow} />
      {children}
      <Foot n={n} />
    </Page>
  );
}

/** Página de afirmação (fundo preto, texto centrado). */
function StatementPage({
  n,
  eyebrow,
  title,
  body,
}: {
  n: number;
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
}) {
  return (
    <Page size={[960, 540]} style={s.pageInk}>
      <Eyebrow num={String(n).padStart(2, "0")} label={eyebrow} ink />
      <View style={s.center}>
        <Text style={[s.h1, { color: CREAM }]}>{title}</Text>
        {body ? <Text style={s.leadInk}>{body}</Text> : null}
      </View>
      <View style={s.footer} fixed>
        <Text style={[s.footerText, { color: INK4 }]}>DESTAQUE.AI</Text>
        <Text style={[s.footerText, { color: INK4 }]}>
          {`${String(n).padStart(2, "0")} / ${TOTAL}`}
        </Text>
      </View>
    </Page>
  );
}

export async function buildPdf(deck: DeckData): Promise<Buffer> {
  const summary = deck.audit?.summary;
  const top10 = findBenchmark(deck.benchmarks, "aio_top10_share");
  const { glossary, dimensions } = deck.method;

  // Ponto de partida (slide 13): rótulo honesto da marca mais citada.
  const topCited = summary?.top_competitors?.[0] ?? "—";
  const topIsTool = topCited !== "—" && isGeoTool(topCited);

  const doc = (
    <Document
      title={`Proposta — ${deck.companyName}`}
      author="destaque.ai"
      subject="Proposta de Generative Engine Optimization"
    >
      {/* 01 — Capa */}
      <Page size={[960, 540]} style={s.page}>
        <View style={s.accentBar} />
        <View style={s.center}>
          <Text style={[s.eyebrowText, { marginBottom: 18 }]}>
            PROPOSTA · GENERATIVE ENGINE OPTIMIZATION
          </Text>
          <Text style={[s.h1, { fontSize: 54 }]}>
            {deck.customMessage?.trim() ? (
              san(deck.customMessage.trim())
            ) : (
              <>
                Proposta para <Mark>{san(deck.companyName)}</Mark>
              </>
            )}
          </Text>
          <Text style={[s.body, { marginTop: 22 }]}>
            destaque.ai · Lisboa ·{" "}
            {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </Text>
        </View>
        <Foot n={1} />
      </Page>

      {/* 02 — O problema */}
      <StatementPage
        n={2}
        eyebrow="O problema"
        title={
          <>
            A pesquisa mudou de <Mark>sítio</Mark>.
          </>
        }
        body="Os teus clientes deixaram de escrever no Google. Perguntam ao ChatGPT, ao Claude, ao Gemini — e a IA responde com nomes."
      />

      {/* 03 — O vilão concreto (cria tensão; nomes vêm do nosso estudo) */}
      <ContentPage n={3} eyebrow="Quem aparece">
        <Text style={s.h2}>
          E o nome não é o <Mark>teu</Mark>.
        </Text>
        <Text style={[s.body, { marginTop: 14, maxWidth: 760 }]}>
          Agora mesmo, um comprador pergunta à IA pela tua categoria. A resposta traz
          três nomes — e hoje são os teus concorrentes.
        </Text>
        <View style={[s.row, { marginTop: 30 }]}>
          {(
            [
              ["Pagamentos", "Stripe"],
              ["Hotelaria", "Cloudbeds"],
              ["Indústria", "UpKeep"],
            ] as const
          ).map(([cat, name], i, arr) => (
            <View key={cat} style={{ flex: 1, paddingRight: i === arr.length - 1 ? 0 : 24 }}>
              <Text style={{ fontFamily: SANS, fontSize: 9, letterSpacing: 1, color: INK3 }}>
                {cat.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: SERIF, fontSize: 32, color: INK, marginTop: 6 }}>
                {name}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: SERIF, fontSize: 17, color: INK, marginTop: 30 }}>
          A marca portuguesa ficava de fora.
        </Text>
        <Text style={{ fontFamily: SANS, fontSize: 8.5, color: INK4, marginTop: 14 }}>
          Estudo destaque.ai, 2026 — 45 SaaS B2B portuguesas, 3 motores de IA.
        </Text>
      </ContentPage>

      {/* 04 — A prova própria (momento de viragem; 60% herói) */}
      <ContentPage n={4} eyebrow="A prova">
        <Text style={s.h2}>
          Não é teoria. Fizemos o <Mark>estudo</Mark>.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 22 }}>
          <Text style={{ fontFamily: SERIF, fontSize: 96, color: INK, letterSpacing: -3 }}>
            60
          </Text>
          <Text style={[s.mark, { fontFamily: SERIF, fontSize: 64, marginBottom: 10 }]}>%</Text>
        </View>
        <Text style={[s.body, { marginTop: 12, maxWidth: 780, fontSize: 12 }]}>
          Auditámos 45 SaaS B2B portuguesas em 3 motores de IA. 60% não é recomendada por
          nenhum. 31% é completamente invisível — a IA nem as nomeia.
        </Text>
        <Text style={{ fontFamily: SERIF, fontSize: 22, color: INK, marginTop: 22 }}>
          Estás nos 40%, ou nos <Mark>60%</Mark>?
        </Text>
        <Text style={{ fontFamily: SANS, fontSize: 8.5, color: INK4, marginTop: 16 }}>
          Estudo destaque.ai, 2026 · {STUDY_URL}
        </Text>
      </ContentPage>

      {/* 05 — O espelho (auditoria personalizada do cliente — resposta ao "60%?") */}
      <ContentPage n={5} eyebrow={`Auditoria personalizada · ${san(deck.companyName)}`}>
        <Text style={s.h2}>
          E sobre ti, o que diz a <Mark>IA</Mark>?
        </Text>
        <View style={[s.row, { marginTop: 28 }]}>
          {[
            ["Taxa de citação", summary ? pct(summary.citation_rate) : "—"],
            ["Share of voice", summary ? pct(summary.share_of_voice) : "—"],
            ["Posição média", summary?.avg_position != null ? `#${summary.avg_position}` : "—"],
          ].map(([l, v], i, arr) => (
            <View key={l} style={{ flex: 1, paddingRight: i === arr.length - 1 ? 0 : 24 }}>
              <Text style={s.cardLabel}>{l.toUpperCase()}</Text>
              <Text style={{ fontFamily: SERIF, fontSize: 64, color: INK, marginTop: 4 }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 28 }}>
          {(deck.prompts.length ? deck.prompts : []).slice(0, 2).map((p, i) => (
            <Text
              key={i}
              style={{ fontFamily: SERIF, fontSize: 13, color: INK2, marginBottom: 8, lineHeight: 1.35 }}
            >
              «{san(p)}»
            </Text>
          ))}
        </View>
        <Text style={{ fontFamily: SANS, fontSize: 10, color: INK3, marginTop: 16 }}>
          Auditámos os prompts que decidem a tua categoria. Não apareces em nenhum.
          ({(deck.prompts.length || 0)} prompts completos no Apêndice A.)
        </Text>
      </ContentPage>

      {/* 06 — A esperança (o destino) */}
      <StatementPage
        n={6}
        eyebrow="O destino"
        title={
          <>
            Imagina o <Mark>contrário</Mark>.
          </>
        }
        body="Um comprador pergunta à IA pela tua categoria. A resposta começa com o teu nome. Não pagaste por isso — foste citado porque a IA confia em ti. É isto que o GEO constrói: estar na resposta, não na página 2 que ninguém abre."
      />

      {/* 07 — O contexto (stats de terceiros — reforço, depois da prova própria) */}
      <ContentPage n={7} eyebrow="O contexto">
        <Text style={s.h2}>
          Não é uma tendência. É <Mark>já</Mark>.
        </Text>
        <View style={[s.row, { marginTop: 36 }]}>
          {deck.benchmarks.slice(0, 3).map((b) => (
            <View key={b.key} style={s.statCol}>
              <Text style={s.statValue}>{san(b.value)}</Text>
              <Text style={s.statLabel}>{san(b.caption)}</Text>
              <Text style={{ fontFamily: SANS, fontSize: 8, color: INK4, marginTop: 6 }}>
                {san(b.source_name)}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: SANS, fontSize: 8.5, color: INK3, marginTop: 22 }}>
          Estudos US-EN; evidência PT-PT específica ainda é escassa — números direccionais.
          Os nossos dados PT (slide 04) vêm primeiro; estes reforçam.
        </Text>
      </ContentPage>

      {/* 08 — SEO vs GEO */}
      <ContentPage n={8} eyebrow="SEO vs GEO">
        <Text style={s.h2}>
          O GEO <Mark>assenta</Mark> sobre o SEO.
        </Text>
        <Text style={[s.body, { marginTop: 12, maxWidth: 720 }]}>
          {top10 ? `${san(top10.value)} ${san(top10.caption)}. ` : ""}O SEO é o substrato;
          o GEO é a camada que te torna citável. Precisas dos dois.
          {top10 ? ` (${san(top10.source_name)}.)` : ""}
        </Text>
        <View style={[s.row, { marginTop: 26 }]}>
          {(
            [
              ["SEO", deck.method.seoVsGeo.map((r) => r.seo)],
              ["GEO", deck.method.seoVsGeo.map((r) => r.geo)],
            ] as const
          ).map(([head, rows], ci) => (
            <View key={head} style={{ flex: 1, paddingRight: ci === 0 ? 24 : 0 }}>
              <Text
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: 2,
                  color: ci === 1 ? "#A16207" : INK3,
                  marginBottom: 14,
                }}
              >
                {head}
              </Text>
              {rows.map((r) => (
                <Text
                  key={r}
                  style={{
                    fontFamily: SERIF,
                    fontSize: 15,
                    color: INK,
                    paddingVertical: 9,
                    borderTopWidth: 1,
                    borderColor: RULE,
                  }}
                >
                  {san(r)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 09 — Definição (glossário vivo da skill: SEO · GEO · AEO) */}
      <Page size={[960, 540]} style={s.pageInk}>
        <Eyebrow num="09" label="A definição" ink />
        <View style={s.center}>
          <Text style={[s.h2, { color: CREAM, maxWidth: 720 }]}>
            A categoria tem <Mark>vários nomes</Mark>.
          </Text>
          <View style={[s.row, { marginTop: 26 }]}>
            {glossary.map((g) => (
              <View key={g.sigla} style={{ flex: 1, paddingRight: 28 }}>
                <Text style={{ fontFamily: SERIF, fontSize: 24, color: CREAM }}>{san(g.sigla)}</Text>
                <Text style={{ fontFamily: SANS, fontSize: 10, lineHeight: 1.5, color: INK4, marginTop: 5 }}>
                  <Text style={{ fontFamily: SANS_B, color: CREAM }}>{san(g.nome)}.</Text> {san(g.definicao)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: SANS, fontSize: 9, color: INK4, marginTop: 26, maxWidth: 640 }}>
            Nomes distintos, problema único — ser <Mark>citável</Mark> pelos motores que decidem por quem clica.
            O SINAL trata-os como uma só disciplina integrada.
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text style={[s.footerText, { color: INK4 }]}>DESTAQUE.AI</Text>
          <Text style={[s.footerText, { color: INK4 }]}>{`09 / ${TOTAL}`}</Text>
        </View>
      </Page>

      {/* 10 — Metodologia (8 dimensões vivas da skill) */}
      <ContentPage n={10} eyebrow="Metodologia · SINAL">
        <Text style={s.h2}>
          <Mark>SINAL</Mark>: o sistema que te põe na resposta.
        </Text>
        <Text style={[s.body, { marginTop: 8 }]}>{san(deck.method.sinal)}</Text>
        {[dimensions.slice(0, 4), dimensions.slice(4, 8)].map((rowDims, ri) => (
          <View key={ri} style={[s.row, { marginTop: ri === 0 ? 22 : 16 }]}>
            {rowDims.map((d) => (
              <View key={d.n} style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: SANS, fontSize: 9, color: "#A16207", letterSpacing: 1 }}>
                  {d.n.padStart(2, "0")}
                </Text>
                <Text style={{ fontFamily: SERIF, fontSize: 14, color: INK, marginTop: 6 }}>
                  {san(d.dimensao)}
                </Text>
                <Text style={[s.body, { marginTop: 5, fontSize: 8.5 }]}>{san(d.foco)}</Text>
              </View>
            ))}
          </View>
        ))}
        <Text style={{ fontFamily: SANS, fontSize: 8.5, color: INK3, marginTop: 18 }}>
          As acções saem num plano de 4 horizontes — semana 1-2, 3-6, 7-12 e 90+ dias.
        </Text>
      </ContentPage>

      {/* 11 — Fases 1 e 2 */}
      <ContentPage n={11} eyebrow="Fases 1 e 2">
        <Text style={s.h2}>
          Diagnóstico e <Mark>conteúdo</Mark>.
        </Text>
        <View style={{ marginTop: 26 }}>
          {(
            [
              ["Fase 01 · Auditoria", "2 semanas", "Auditoria GEO completa, benchmark competitivo e roadmap priorizado por impacto."],
              ["Fase 02 · Conteúdo", "4-6 semanas", "Correção de entidade e higiene técnica (schema, sameAs, llms.txt) e páginas-resposta extraíveis — base, não alavanca de citação."],
            ] as const
          ).map(([t, dur, d]) => (
            <View
              key={t}
              style={{ flexDirection: "row", paddingVertical: 16, borderTopWidth: 1, borderColor: RULE }}
            >
              <View style={{ width: 200 }}>
                <Text style={{ fontFamily: SANS_B, fontSize: 11, color: "#A16207" }}>{t}</Text>
                <Text style={{ fontFamily: SANS, fontSize: 9, color: INK3, marginTop: 4 }}>
                  {dur}
                </Text>
              </View>
              <Text style={{ flex: 1, fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.4 }}>
                {d}
              </Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 12 — Fases 3 e 4 */}
      <ContentPage n={12} eyebrow="Fases 3 e 4">
        <Text style={s.h2}>
          Distribuição e <Mark>medição</Mark>.
        </Text>
        <View style={{ marginTop: 26 }}>
          {(
            [
              ["Fase 03 · Distribuição", "contínua", "Autoridade nas fontes que os modelos citam e cobertura editorial distribuída."],
              ["Fase 04 · Medição", "mensal", "Tracking de citações e share of voice, com relatório consolidado todos os meses."],
            ] as const
          ).map(([t, dur, d]) => (
            <View
              key={t}
              style={{ flexDirection: "row", paddingVertical: 16, borderTopWidth: 1, borderColor: RULE }}
            >
              <View style={{ width: 200 }}>
                <Text style={{ fontFamily: SANS_B, fontSize: 11, color: "#A16207" }}>{t}</Text>
                <Text style={{ fontFamily: SANS, fontSize: 9, color: INK3, marginTop: 4 }}>
                  {dur}
                </Text>
              </View>
              <Text style={{ flex: 1, fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.4 }}>
                {d}
              </Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 13 — Ponto de partida */}
      <ContentPage n={13} eyebrow="Ponto de partida">
        <Text style={s.h2}>
          Onde a <Mark>destaque.ai</Mark> está hoje.
        </Text>
        <View style={[s.row, { marginTop: 30 }]}>
          {[
            ["Taxa de citação", summary ? pct(summary.citation_rate) : "—"],
            ["Share of voice", summary ? pct(summary.share_of_voice) : "—"],
            ["Posição média", summary?.avg_position != null ? `#${summary.avg_position}` : "—"],
            [topIsTool ? "Ferramenta de referência" : "Marca mais citada", san(topCited)],
          ].map(([l, v], i, arr) => (
            <View key={l} style={[s.card, i === arr.length - 1 ? { marginRight: 0 } : {}]}>
              <Text style={s.cardLabel}>{l.toUpperCase()}</Text>
              <Text style={s.cardValue}>{v}</Text>
              {i === arr.length - 1 && topIsTool ? (
                <Text style={s.cardNote}>ferramenta de medição, não consultora</Text>
              ) : null}
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 14 — Investimento */}
      <ContentPage n={14} eyebrow="Investimento">
        <Text style={s.h2}>
          Três fases, uma <Mark>decisão de cada vez</Mark>.
        </Text>
        <View style={[s.row, { marginTop: 30 }]}>
          {[
            {
              name: "Diagnóstico",
              price: eurOrPlaceholder(deck.pricing.diagnostico),
              unit: deck.pricing.diagnostico != null ? "one-off" : "",
            },
            {
              name: "Sprint",
              price: eurOrPlaceholder(deck.pricing.sprint),
              unit: deck.pricing.sprint != null ? "one-off" : "",
              hot: true,
            },
            {
              name: "Retainer",
              price: eurOrPlaceholder(deck.pricing.retainer),
              unit: deck.pricing.retainer != null ? "/ mês" : "",
            },
          ].map((t, i, arr) => (
            <View
              key={t.name}
              style={[
                s.card,
                { padding: 22 },
                t.hot ? { backgroundColor: AMBER, borderColor: AMBER } : {},
                i === arr.length - 1 ? { marginRight: 0 } : {},
              ]}
            >
              <Text style={s.cardLabel}>{t.name.toUpperCase()}</Text>
              <Text style={[s.cardValue, { fontSize: 30 }]}>{t.price}</Text>
              <Text style={s.cardNote}>{t.unit}</Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 15 — Próximos passos */}
      <ContentPage n={15} eyebrow="A seguir">
        <Text style={s.h2}>
          O que acontece <Mark>a partir daqui</Mark>.
        </Text>
        <View style={{ marginTop: 26 }}>
          {(
            [
              ["01", "Conversa de alinhamento", "30 minutos para confirmar contexto, objectivos e âmbito."],
              ["02", "Arranque do diagnóstico", "Auditoria GEO completa e roadmap priorizado em 2 semanas."],
              ["03", "Decisão sobre o sprint", "Revemos o roadmap juntos e decidimos a implementação."],
            ] as const
          ).map(([n, t, d]) => (
            <View
              key={n}
              style={{ flexDirection: "row", paddingVertical: 16, borderTopWidth: 1, borderColor: RULE }}
            >
              <Text style={{ width: 48, fontFamily: SANS, fontSize: 11, color: "#A16207" }}>
                {n}
              </Text>
              <Text style={{ width: 220, fontFamily: SERIF, fontSize: 16, color: INK }}>{t}</Text>
              <Text style={{ flex: 1, fontFamily: SANS, fontSize: 11, color: INK3, lineHeight: 1.5 }}>
                {d}
              </Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 16 — Apêndices */}
      <StatementPage
        n={16}
        eyebrow="Apêndices"
        title={
          <>
            O <Mark>detalhe</Mark>, para quem o quer.
          </>
        }
        body="As próximas páginas abrem cada fase — entregáveis, duração e investimento."
      />

      {/* 17-19 — Apêndices A/B/C */}
      {(
        [
          {
            n: 17,
            code: "A",
            title: "Diagnóstico",
            meta:
              deck.pricing.diagnostico != null
                ? `2 semanas · ${eur(deck.pricing.diagnostico)}`
                : "2 semanas · Sob consulta",
            rows: [
              [
                "Auditoria GEO",
                `${deck.prompts.length} prompts × ${ENGINE_COUNT} motores analisados.`,
              ],
              ["Benchmark", "Posição face à concorrência directa."],
              ["Roadmap", "Acções ordenadas por esforço e retorno."],
            ],
          },
          {
            n: 18,
            code: "B",
            title: "Sprint",
            meta:
              deck.pricing.sprint != null
                ? `4-6 semanas · ${eur(deck.pricing.sprint)}`
                : "4-6 semanas · Sob consulta",
            rows: [
              ["Técnico", "Correção de entidade e higiene técnica (schema, sameAs, llms.txt)."],
              ["Editorial", "Conteúdo extraível e páginas-resposta."],
              ["Autoridade", "Sinais externos e fontes que a IA cita."],
            ],
          },
          {
            n: 19,
            code: "C",
            title: "Retainer",
            meta:
              deck.pricing.retainer != null
                ? `Mensal · ${eur(deck.pricing.retainer)} / mês`
                : "Mensal · Sob consulta",
            rows: [
              ["Monitorização", `Tracking contínuo nos ${ENGINE_COUNT} motores.`],
              ["Iteração", "Ajustes à medida que os modelos evoluem."],
              ["Relatório", "Dashboard e report consolidado mensal."],
            ],
          },
        ] as const
      ).map((ap) => (
        <ContentPage key={ap.n} n={ap.n} eyebrow={`Apêndice ${ap.code} · ${ap.title}`}>
          <Text style={s.h2}>{ap.title}</Text>
          <Text style={[s.body, { marginTop: 8 }]}>{ap.meta}</Text>
          <View style={{ marginTop: 22 }}>
            {ap.rows.map(([h, d]) => (
              <View
                key={h}
                style={{ flexDirection: "row", paddingVertical: 14, borderTopWidth: 1, borderColor: RULE }}
              >
                <Text style={{ width: 180, fontFamily: SANS_B, fontSize: 11, color: "#A16207" }}>
                  {h}
                </Text>
                <Text style={{ flex: 1, fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.4 }}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
          {ap.code === "A" && deck.prompts.length > 0 && (
            <View style={{ marginTop: 18 }}>
              <Text style={[s.cardLabel, { marginBottom: 8 }]}>PROMPTS AUDITADOS</Text>
              {deck.prompts.slice(0, 5).map((p, i) => (
                <Text
                  key={i}
                  style={{ fontFamily: SERIF, fontSize: 11, color: INK2, marginBottom: 6, lineHeight: 1.3 }}
                >
                  {`${String(i + 1).padStart(2, "0")}   ${san(p)}`}
                </Text>
              ))}
            </View>
          )}
        </ContentPage>
      ))}

      {/* 20 — Apêndice D · Investimento */}
      <ContentPage n={20} eyebrow="Apêndice D · Investimento">
        <Text style={s.h2}>
          Resumo do <Mark>investimento</Mark>.
        </Text>
        <View style={{ marginTop: 26 }}>
          {(
            [
              [
                "Diagnóstico",
                "2 semanas",
                deck.pricing.diagnostico != null
                  ? `${eur(deck.pricing.diagnostico)} one-off`
                  : "Sob consulta",
              ],
              [
                "Sprint",
                "4-6 semanas",
                deck.pricing.sprint != null
                  ? `${eur(deck.pricing.sprint)} one-off`
                  : "Sob consulta",
              ],
              [
                "Retainer",
                "mensal",
                deck.pricing.retainer != null
                  ? `${eur(deck.pricing.retainer)} / mês`
                  : "Sob consulta",
              ],
            ] as const
          ).map(([phase, dur, price]) => (
            <View
              key={phase}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderColor: RULE }}
            >
              <Text style={{ flex: 1, fontFamily: SERIF, fontSize: 20, color: INK }}>{phase}</Text>
              <Text style={{ width: 140, fontFamily: SANS, fontSize: 11, color: INK3 }}>{dur}</Text>
              <Text style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>{price}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.body, { marginTop: 16 }]}>
          Valores sem IVA. As fases são sequenciais — podes parar no fim de qualquer uma.
        </Text>
      </ContentPage>

      {/* 21 — Fecho */}
      <Page size={[960, 540]} style={s.pageInk}>
        <Eyebrow num="21" label="Vamos a isto" ink />
        <View style={s.center}>
          <Text style={[s.h1, { color: CREAM, maxWidth: 760 }]}>
            Vamos pôr a tua marca <Mark>no parágrafo</Mark>.
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text style={[s.footerText, { color: INK4 }]}>DESTAQUE.AI</Text>
          <Text style={[s.footerText, { color: INK4 }]}>{`21 / ${TOTAL}`}</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
