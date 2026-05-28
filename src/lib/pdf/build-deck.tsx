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
      <Text style={s.footerText}>{String(n).padStart(2, "0")} / 18</Text>
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
          {String(n).padStart(2, "0")} / 18
        </Text>
      </View>
    </Page>
  );
}

export async function buildPdf(deck: DeckData): Promise<Buffer> {
  const summary = deck.audit?.summary;

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
              deck.customMessage.trim()
            ) : (
              <>
                Proposta para <Mark>{deck.companyName}</Mark>
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

      {/* 03 — O contexto (stats citados — mesma fonte que o HTML) */}
      <ContentPage n={3} eyebrow="O contexto">
        <Text style={s.h2}>
          Não é uma tendência. É <Mark>já</Mark>.
        </Text>
        <View style={[s.row, { marginTop: 36 }]}>
          {deck.benchmarks.slice(0, 3).map((b) => (
            <View key={b.key} style={s.statCol}>
              <Text style={s.statValue}>{b.value}</Text>
              <Text style={s.statLabel}>{b.caption}</Text>
              <Text style={{ fontFamily: SANS, fontSize: 8, color: INK4, marginTop: 6 }}>
                {b.source_name}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: SANS, fontSize: 8.5, color: INK3, marginTop: 22, fontStyle: "italic" }}>
          Estudos US-EN; evidência PT-PT específica ainda é escassa — números direccionais.
        </Text>
      </ContentPage>

      {/* 04 — Auditoria personalizada (invertido: 0% é o herói) */}
      <ContentPage n={4} eyebrow={`Auditoria personalizada · ${deck.companyName}`}>
        <Text style={s.h2}>
          O que a IA diz sobre ti, <Mark>hoje</Mark>.
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
              «{p}»
            </Text>
          ))}
        </View>
        <Text style={{ fontFamily: SANS, fontSize: 10, color: INK3, marginTop: 16 }}>
          Auditámos os prompts que decidem a tua categoria. Não apareces em nenhum.
          ({(deck.prompts.length || 0)} prompts completos no Apêndice A.)
        </Text>
      </ContentPage>

      {/* 05 — SEO vs GEO */}
      <ContentPage n={5} eyebrow="SEO vs GEO">
        <Text style={s.h2}>
          O GEO <Mark>assenta</Mark> sobre o SEO.
        </Text>
        <Text style={[s.body, { marginTop: 12, maxWidth: 720 }]}>
          54% das citações em AI Overviews vêm do top-10 orgânico. O SEO é o substrato;
          o GEO é a camada que te torna citável. Precisas dos dois. (BrightEdge, 2026.)
        </Text>
        <View style={[s.row, { marginTop: 26 }]}>
          {(
            [
              [
                "SEO",
                [
                  "Otimizas para 10 links azuis",
                  "O utilizador escolhe",
                  "Palavras-chave e backlinks",
                  "Posições no Google",
                ],
              ],
              [
                "GEO",
                [
                  "Otimizas para 1 resposta",
                  "A IA escolhe por ele",
                  "Estrutura e citabilidade",
                  `Menções em ${ENGINE_COUNT} motores`,
                ],
              ],
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
                  {r}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 06 — Definição */}
      <Page size={[960, 540]} style={s.pageInk}>
        <Eyebrow num="06" label="A definição" ink />
        <View style={s.center}>
          <View style={{ backgroundColor: AMBER, alignSelf: "flex-start", paddingHorizontal: 24, paddingVertical: 8 }}>
            <Text style={{ fontFamily: SERIF, fontSize: 120, color: INK, letterSpacing: -4 }}>
              GEO
            </Text>
          </View>
          <Text style={[s.leadInk, { marginTop: 24, maxWidth: 620 }]}>
            Generative Engine Optimization — as práticas técnicas e editoriais que tornam
            uma marca citável pelos modelos de IA generativa.
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text style={[s.footerText, { color: INK4 }]}>DESTAQUE.AI</Text>
          <Text style={[s.footerText, { color: INK4 }]}>06 / 18</Text>
        </View>
      </Page>

      {/* 07 — Metodologia */}
      <ContentPage n={7} eyebrow="Metodologia · SINAL">
        <Text style={s.h2}>
          <Mark>SINAL</Mark>: quatro disciplinas, um sistema.
        </Text>
        <Text style={[s.body, { marginTop: 10 }]}>
          Sistema Integrado destaque.ai de Notabilidade em AI search e LLMs.
        </Text>
        <View style={[s.row, { marginTop: 30 }]}>
          {(
            [
              ["01", "Auditoria", `Medimos a visibilidade real em ${ENGINE_COUNT} motores.`],
              ["02", "Conteúdo", "Tornamos a marca extraível pela IA."],
              ["03", "Distribuição", "Construímos autoridade onde a IA procura."],
              ["04", "Medição", "Monitorizamos e iteramos com dados."],
            ] as const
          ).map(([n, t, d]) => (
            <View key={n} style={{ flex: 1, paddingRight: 18 }}>
              <Text style={{ fontFamily: SANS, fontSize: 10, color: "#A16207", letterSpacing: 1 }}>
                {n}
              </Text>
              <Text style={{ fontFamily: SERIF, fontSize: 20, color: INK, marginTop: 8 }}>
                {t}
              </Text>
              <Text style={[s.body, { marginTop: 8 }]}>{d}</Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 08 — Fases 1 e 2 */}
      <ContentPage n={8} eyebrow="Fases 1 e 2">
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

      {/* 09 — Fases 3 e 4 */}
      <ContentPage n={9} eyebrow="Fases 3 e 4">
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

      {/* 10 — Ponto de partida */}
      <ContentPage n={10} eyebrow="Ponto de partida">
        <Text style={s.h2}>
          Onde a <Mark>destaque.ai</Mark> está hoje.
        </Text>
        <View style={[s.row, { marginTop: 30 }]}>
          {[
            ["Taxa de citação", summary ? pct(summary.citation_rate) : "—"],
            ["Share of voice", summary ? pct(summary.share_of_voice) : "—"],
            ["Posição média", summary?.avg_position != null ? `#${summary.avg_position}` : "—"],
            ["Marca mais citada na categoria", summary?.top_competitors[0] ?? "—"],
          ].map(([l, v], i, arr) => (
            <View key={l} style={[s.card, i === arr.length - 1 ? { marginRight: 0 } : {}]}>
              <Text style={s.cardLabel}>{l.toUpperCase()}</Text>
              <Text style={s.cardValue}>{v}</Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 11 — Investimento */}
      <ContentPage n={11} eyebrow="Investimento">
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

      {/* 12 — Próximos passos */}
      <ContentPage n={12} eyebrow="A seguir">
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

      {/* 13 — Apêndices */}
      <StatementPage
        n={13}
        eyebrow="Apêndices"
        title={
          <>
            O <Mark>detalhe</Mark>, para quem o quer.
          </>
        }
        body="As próximas páginas abrem cada fase — entregáveis, duração e investimento."
      />

      {/* 14-16 — Apêndices A/B/C */}
      {(
        [
          {
            n: 14,
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
            n: 15,
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
            n: 16,
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
                  {String(i + 1).padStart(2, "0")}   {p}
                </Text>
              ))}
            </View>
          )}
        </ContentPage>
      ))}

      {/* 17 — Apêndice D · Investimento */}
      <ContentPage n={17} eyebrow="Apêndice D · Investimento">
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

      {/* 18 — Fecho */}
      <Page size={[960, 540]} style={s.pageInk}>
        <Eyebrow num="18" label="Vamos a isto" ink />
        <View style={s.center}>
          <Text style={[s.h1, { color: CREAM, maxWidth: 760 }]}>
            Vamos pôr a tua marca <Mark>no parágrafo</Mark>.
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text style={[s.footerText, { color: INK4 }]}>DESTAQUE.AI</Text>
          <Text style={[s.footerText, { color: INK4 }]}>18 / 18</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
