import PptxGenJS from "pptxgenjs";
import type { DeckData } from "@/components/deck/types";
import { eur, pct } from "@/lib/utils/format";

// Paleta da marca (hex sem #, como o pptxgenjs exige).
const CREAM = "F5F1E8";
const INK = "0A0A0A";
const AMBER = "FACC15";
const INK3 = "6B6355";
const INK4 = "999999";
const PAPER2 = "FFFFFF";
const RULE = "D4CFC0";

// Fraunces/Geist não são embebidas — degradam para a fonte mais próxima
// no PowerPoint do leitor, preservando a intenção tipográfica.
const SERIF = "Fraunces";
const SANS = "Geist";

const W = 13.333;
const H = 7.5;
const MX = 0.9;

type Slide = ReturnType<PptxGenJS["addSlide"]>;

function base(pptx: PptxGenJS, dark: boolean): Slide {
  const slide = pptx.addSlide();
  slide.background = { color: dark ? INK : CREAM };
  return slide;
}

function eyebrow(slide: Slide, num: string, label: string, dark: boolean) {
  slide.addText(
    [
      { text: `${num}   `, options: { color: dark ? INK4 : INK3 } },
      { text: label.toUpperCase(), options: { color: dark ? INK4 : INK3 } },
    ],
    {
      x: MX,
      y: 0.62,
      w: W - MX * 2,
      h: 0.4,
      fontFace: SANS,
      fontSize: 11,
      charSpacing: 2,
    },
  );
  slide.addShape("line", {
    x: MX,
    y: 1.04,
    w: W - MX * 2,
    h: 0,
    line: { color: dark ? "2A2A2A" : RULE, width: 0.75 },
  });
}

function heading(slide: Slide, text: string, dark: boolean, y = 1.4) {
  slide.addText(text, {
    x: MX,
    y,
    w: W - MX * 2,
    h: 1.2,
    fontFace: SERIF,
    fontSize: 34,
    color: dark ? CREAM : INK,
  });
}

function statCard(
  slide: Slide,
  o: { x: number; y: number; w: number; label: string; value: string; dark: boolean },
) {
  slide.addText(o.label.toUpperCase(), {
    x: o.x,
    y: o.y,
    w: o.w,
    h: 0.4,
    fontFace: SANS,
    fontSize: 10,
    color: o.dark ? INK4 : INK3,
    charSpacing: 1,
  });
  slide.addText(o.value, {
    x: o.x,
    y: o.y + 0.32,
    w: o.w,
    h: 1.1,
    fontFace: SERIF,
    fontSize: 38,
    color: o.dark ? CREAM : INK,
  });
}

function bulletList(
  slide: Slide,
  rows: [string, string][],
  o: { x: number; y: number; w: number; dark: boolean },
) {
  rows.forEach(([h, d], i) => {
    const y = o.y + i * 0.95;
    slide.addText(h, {
      x: o.x,
      y,
      w: 3.4,
      h: 0.5,
      fontFace: SANS,
      fontSize: 12,
      bold: true,
      color: o.dark ? AMBER : INK,
    });
    slide.addText(d, {
      x: o.x + 3.6,
      y,
      w: o.w - 3.6,
      h: 0.7,
      fontFace: SERIF,
      fontSize: 16,
      color: o.dark ? INK4 : INK3,
    });
  });
}

export async function buildPptx(deck: DeckData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "DECK", width: W, height: H });
  pptx.layout = "DECK";
  pptx.author = "destaque.ai";
  pptx.company = "destaque.ai";
  pptx.title = `Proposta — ${deck.companyName}`;

  const summary = deck.audit?.summary;

  /* 01 · Capa */
  {
    const s = base(pptx, false);
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: AMBER } });
    s.addText("PROPOSTA · GENERATIVE ENGINE OPTIMIZATION", {
      x: MX,
      y: 1.2,
      w: W - MX * 2,
      h: 0.4,
      fontFace: SANS,
      fontSize: 11,
      color: INK3,
      charSpacing: 2,
    });
    s.addText(deck.customMessage?.trim() || `Proposta para ${deck.companyName}`, {
      x: MX,
      y: 2.4,
      w: W - MX * 2,
      h: 2.6,
      fontFace: SERIF,
      fontSize: 52,
      color: INK,
      lineSpacing: 54,
    });
    s.addText(
      `destaque.ai · Lisboa · ${new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}`,
      { x: MX, y: 6.2, w: 9, h: 0.5, fontFace: SANS, fontSize: 12, color: INK3 },
    );
  }

  /* 02 · O problema */
  {
    const s = base(pptx, true);
    eyebrow(s, "01", "O problema", true);
    s.addText("A pesquisa mudou de sítio.", {
      x: MX,
      y: 2,
      w: W - MX * 2,
      h: 2,
      fontFace: SERIF,
      fontSize: 52,
      color: CREAM,
    });
    s.addText(
      "Os teus clientes deixaram de escrever no Google. Perguntam ao ChatGPT, ao Claude, ao Gemini — e a IA responde com nomes.",
      { x: MX, y: 4.4, w: 9, h: 1.5, fontFace: SANS, fontSize: 16, color: INK4, lineSpacing: 24 },
    );
  }

  /* 03 · O contexto */
  {
    const s = base(pptx, false);
    eyebrow(s, "02", "O contexto", false);
    heading(s, "Não é uma tendência. É já.", false);
    const stats: [string, string][] = [
      ["13%", "da pesquisa global já passa por motores de IA."],
      ["40%", "dos utilizadores confiam na IA sem clicar num link."],
      ["70%", "das decisões B2B começam com investigação por IA."],
    ];
    const cw = (W - MX * 2 - 0.6) / 3;
    stats.forEach(([v, d], i) => {
      const x = MX + i * (cw + 0.3);
      s.addText(v, { x, y: 2.8, w: cw, h: 1.4, fontFace: SERIF, fontSize: 72, color: INK });
      s.addText(d, { x, y: 4.2, w: cw, h: 1.4, fontFace: SANS, fontSize: 13, color: INK3 });
    });
  }

  /* 04 · Auditoria personalizada */
  {
    const s = base(pptx, false);
    eyebrow(s, "03", `Auditoria personalizada · ${deck.companyName}`, false);
    heading(s, "O que a IA diz sobre ti, hoje.", false);
    // Prompts auditados
    deck.prompts.slice(0, 5).forEach((p, i) => {
      s.addText(
        [
          { text: `PROMPT ${String(i + 1).padStart(2, "0")}   `, options: { color: INK3, fontFace: SANS, fontSize: 9 } },
          { text: p, options: { color: INK, fontFace: SERIF, fontSize: 14 } },
        ],
        { x: MX, y: 2.5 + i * 0.42, w: 7.6, h: 0.4 },
      );
    });
    // KPIs à direita
    const kx = 8.9;
    statCard(s, { x: kx, y: 2.5, w: 3.5, label: "Citation rate", value: summary ? pct(summary.citation_rate) : "—", dark: false });
    statCard(s, { x: kx, y: 3.9, w: 3.5, label: "Share of voice", value: summary ? pct(summary.share_of_voice) : "—", dark: false });
    statCard(s, {
      x: kx,
      y: 5.3,
      w: 3.5,
      label: "Posição média",
      value: summary?.avg_position != null ? `#${summary.avg_position}` : "—",
      dark: false,
    });
  }

  /* 05 · SEO vs GEO */
  {
    const s = base(pptx, false);
    eyebrow(s, "04", "SEO vs GEO", false);
    heading(s, "Não substitui o SEO. Sucede-o.", false);
    const rows: [string, string][] = [
      ["Otimizas para 10 links azuis", "Otimizas para 1 resposta"],
      ["O utilizador escolhe", "A IA escolhe por ele"],
      ["Palavras-chave e backlinks", "Estrutura e citabilidade"],
      ["Posições no Google", "Menções em 4 motores"],
    ];
    const colW = (W - MX * 2 - 0.3) / 2;
    s.addText("SEO", { x: MX, y: 2.6, w: colW, h: 0.4, fontFace: SANS, fontSize: 12, color: INK3, charSpacing: 2 });
    s.addText("GEO", {
      x: MX + colW + 0.3,
      y: 2.6,
      w: colW,
      h: 0.4,
      fontFace: SANS,
      fontSize: 12,
      color: "A16207",
      charSpacing: 2,
    });
    rows.forEach(([seo, geo], i) => {
      const y = 3.15 + i * 0.78;
      s.addText(seo, { x: MX, y, w: colW, h: 0.7, fontFace: SERIF, fontSize: 16, color: INK });
      s.addText(geo, { x: MX + colW + 0.3, y, w: colW, h: 0.7, fontFace: SERIF, fontSize: 16, color: INK });
    });
  }

  /* 06 · Definição */
  {
    const s = base(pptx, true);
    eyebrow(s, "05", "A definição", true);
    s.addShape("rect", { x: MX, y: 1.7, w: 6.6, h: 3, fill: { color: AMBER } });
    s.addText("GEO", {
      x: MX,
      y: 1.7,
      w: 6.6,
      h: 3,
      fontFace: SERIF,
      fontSize: 130,
      color: INK,
      align: "center",
      valign: "middle",
    });
    s.addText(
      "Generative Engine Optimization — as práticas que tornam uma marca citável pelos modelos de IA generativa.",
      { x: MX, y: 5.1, w: 10, h: 1.4, fontFace: SANS, fontSize: 16, color: INK4, lineSpacing: 24 },
    );
  }

  /* 07 · Metodologia */
  {
    const s = base(pptx, false);
    eyebrow(s, "06", "Metodologia", false);
    heading(s, "Quatro disciplinas, um sistema.", false);
    const pillars: [string, string, string][] = [
      ["01", "Auditoria", "Medimos a visibilidade real em 4 motores."],
      ["02", "Conteúdo", "Tornamos a marca extraível pela IA."],
      ["03", "Distribuição", "Construímos autoridade onde a IA procura."],
      ["04", "Medição", "Monitorizamos e iteramos com dados."],
    ];
    const cw = (W - MX * 2 - 0.9) / 4;
    pillars.forEach(([n, t, d], i) => {
      const x = MX + i * (cw + 0.3);
      s.addText(n, { x, y: 2.8, w: cw, h: 0.4, fontFace: SANS, fontSize: 11, color: "A16207", charSpacing: 1 });
      s.addText(t, { x, y: 3.2, w: cw, h: 0.6, fontFace: SERIF, fontSize: 22, color: INK });
      s.addText(d, { x, y: 3.9, w: cw, h: 1.5, fontFace: SANS, fontSize: 12, color: INK3, lineSpacing: 18 });
    });
  }

  /* 08 · Fases 1 e 2 */
  {
    const s = base(pptx, false);
    eyebrow(s, "07", "Fases 1 e 2", false);
    heading(s, "Diagnóstico e conteúdo.", false);
    bulletList(
      s,
      [
        ["Fase 01 · Auditoria", "2 semanas — auditoria GEO, benchmark e roadmap priorizado."],
        ["Fase 02 · Conteúdo", "4-6 semanas — schema, conteúdo extraível e páginas-resposta."],
      ],
      { x: MX, y: 3, w: W - MX * 2, dark: false },
    );
  }

  /* 09 · Fases 3 e 4 */
  {
    const s = base(pptx, false);
    eyebrow(s, "08", "Fases 3 e 4", false);
    heading(s, "Distribuição e medição.", false);
    bulletList(
      s,
      [
        ["Fase 03 · Distribuição", "Contínua — autoridade nas fontes que os modelos citam."],
        ["Fase 04 · Medição", "Mensal — tracking de citações e relatório consolidado."],
      ],
      { x: MX, y: 3, w: W - MX * 2, dark: false },
    );
  }

  /* 10 · Ponto de partida (KPIs) */
  {
    const s = base(pptx, false);
    eyebrow(s, "09", "Ponto de partida", false);
    heading(s, `Onde a ${deck.companyName} está hoje.`, false);
    const cards: [string, string][] = [
      ["Taxa de citação", summary ? pct(summary.citation_rate) : "—"],
      ["Share of voice", summary ? pct(summary.share_of_voice) : "—"],
      ["Posição média", summary?.avg_position != null ? `#${summary.avg_position}` : "—"],
      ["Top concorrente", summary?.top_competitors[0] ?? "—"],
    ];
    const cw = (W - MX * 2 - 0.9) / 4;
    cards.forEach(([l, v], i) => {
      const x = MX + i * (cw + 0.3);
      s.addShape("rect", { x, y: 2.8, w: cw, h: 2.2, fill: { color: PAPER2 }, line: { color: RULE, width: 1 } });
      s.addText(l.toUpperCase(), { x: x + 0.25, y: 3.05, w: cw - 0.5, h: 0.4, fontFace: SANS, fontSize: 9, color: INK3, charSpacing: 1 });
      s.addText(v, { x: x + 0.25, y: 3.5, w: cw - 0.5, h: 1.2, fontFace: SERIF, fontSize: 30, color: INK });
    });
  }

  /* 11 · Investimento (pricing) */
  {
    const s = base(pptx, false);
    eyebrow(s, "10", "Investimento", false);
    heading(s, "Três fases, um número claro.", false);
    const tiers = [
      { name: "Diagnóstico", price: eur(deck.pricing.diagnostico), unit: "one-off" },
      { name: "Sprint", price: eur(deck.pricing.sprint), unit: "one-off", hot: true },
      { name: "Retainer", price: eur(deck.pricing.retainer), unit: "/ mês" },
    ];
    const cw = (W - MX * 2 - 0.6) / 3;
    tiers.forEach((t, i) => {
      const x = MX + i * (cw + 0.3);
      s.addShape("rect", {
        x,
        y: 2.8,
        w: cw,
        h: 2.9,
        fill: { color: t.hot ? AMBER : PAPER2 },
        line: { color: t.hot ? AMBER : RULE, width: 1 },
      });
      s.addText(t.name.toUpperCase(), { x: x + 0.3, y: 3.05, w: cw - 0.6, h: 0.4, fontFace: SANS, fontSize: 11, color: INK3, charSpacing: 1 });
      s.addText(t.price, { x: x + 0.3, y: 3.5, w: cw - 0.6, h: 1, fontFace: SERIF, fontSize: 32, color: INK });
      s.addText(t.unit, { x: x + 0.3, y: 4.6, w: cw - 0.6, h: 0.4, fontFace: SANS, fontSize: 12, color: INK3 });
    });
  }

  /* 12 · Próximos passos */
  {
    const s = base(pptx, false);
    eyebrow(s, "11", "A seguir", false);
    heading(s, "O que acontece a partir daqui.", false);
    bulletList(
      s,
      [
        ["01 · Alinhamento", "30 minutos para confirmar contexto e âmbito."],
        ["02 · Diagnóstico", "Auditoria GEO e roadmap em 2 semanas."],
        ["03 · Decisão", "Revemos o roadmap e decidimos o sprint."],
      ],
      { x: MX, y: 2.9, w: W - MX * 2, dark: false },
    );
  }

  /* 13 · Apêndices */
  {
    const s = base(pptx, true);
    eyebrow(s, "Apêndices", "O detalhe de cada fase", true);
    s.addText("O detalhe, para quem o quer.", {
      x: MX,
      y: 2.6,
      w: W - MX * 2,
      h: 1.6,
      fontFace: SERIF,
      fontSize: 44,
      color: CREAM,
    });
  }

  /* 14-16 · Apêndices A/B/C */
  const appendices: { code: string; title: string; meta: string; rows: [string, string][] }[] = [
    {
      code: "A",
      title: "Diagnóstico",
      meta: `2 semanas · ${eur(deck.pricing.diagnostico)}`,
      rows: [
        ["Auditoria GEO", `${deck.prompts.length} prompts × 4 motores analisados.`],
        ["Benchmark", "Posição face à concorrência directa."],
        ["Roadmap", "Acções ordenadas por esforço e retorno."],
      ],
    },
    {
      code: "B",
      title: "Sprint",
      meta: `4-6 semanas · ${eur(deck.pricing.sprint)}`,
      rows: [
        ["Técnico", "Schema.org, dados estruturados, llms.txt."],
        ["Editorial", "Conteúdo extraível e páginas-resposta."],
        ["Autoridade", "Sinais externos e fontes que a IA cita."],
      ],
    },
    {
      code: "C",
      title: "Retainer",
      meta: `Mensal · ${eur(deck.pricing.retainer)} / mês`,
      rows: [
        ["Monitorização", "Tracking contínuo nos 4 motores."],
        ["Iteração", "Ajustes à medida que os modelos evoluem."],
        ["Relatório", "Dashboard e report consolidado mensal."],
      ],
    },
  ];
  appendices.forEach((ap) => {
    const s = base(pptx, false);
    eyebrow(s, `Apêndice ${ap.code}`, ap.title, false);
    heading(s, ap.title, false);
    s.addText(ap.meta, { x: MX, y: 2.3, w: 9, h: 0.4, fontFace: SANS, fontSize: 12, color: INK3 });
    bulletList(s, ap.rows, { x: MX, y: 3.1, w: W - MX * 2, dark: false });
  });

  /* 17 · Apêndice D — investimento */
  {
    const s = base(pptx, false);
    eyebrow(s, "Apêndice D", "Investimento", false);
    heading(s, "Resumo do investimento.", false);
    const rows: [string, string, string][] = [
      ["Diagnóstico", "2 semanas", `${eur(deck.pricing.diagnostico)} one-off`],
      ["Sprint", "4-6 semanas", `${eur(deck.pricing.sprint)} one-off`],
      ["Retainer", "mensal", `${eur(deck.pricing.retainer)} / mês`],
    ];
    rows.forEach(([phase, dur, price], i) => {
      const y = 2.9 + i * 0.95;
      s.addShape("line", { x: MX, y: y - 0.15, w: W - MX * 2, h: 0, line: { color: RULE, width: 0.75 } });
      s.addText(phase, { x: MX, y, w: 4, h: 0.6, fontFace: SERIF, fontSize: 22, color: INK });
      s.addText(dur, { x: MX + 4.2, y: y + 0.08, w: 3, h: 0.5, fontFace: SANS, fontSize: 13, color: INK3 });
      s.addText(price, { x: W - MX - 4, y, w: 4, h: 0.6, fontFace: SERIF, fontSize: 20, color: INK, align: "right" });
    });
  }

  /* 18 · Obrigado */
  {
    const s = base(pptx, true);
    eyebrow(s, "18 / 18", "Vamos a isto", true);
    s.addText(`Obrigado, ${deck.companyName}.`, {
      x: MX,
      y: 2.4,
      w: W - MX * 2,
      h: 2,
      fontFace: SERIF,
      fontSize: 52,
      color: CREAM,
    });
    s.addText("destaque.ai · contacto@destaque.ai · Lisboa, Portugal", {
      x: MX,
      y: 4.8,
      w: W - MX * 2,
      h: 0.6,
      fontFace: SANS,
      fontSize: 15,
      color: AMBER,
    });
  }

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}
