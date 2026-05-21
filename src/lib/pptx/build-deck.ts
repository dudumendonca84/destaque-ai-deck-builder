import PptxGenJS from "pptxgenjs";
import type { DeckData } from "@/components/deck/types";
import { ENGINES, ENGINE_LABEL } from "@/lib/llm/models";
import { eur, pct } from "@/lib/utils/format";

// Paleta da marca (hex sem #, como o pptxgenjs exige).
const CREAM = "F5F1E8";
const INK = "0A0A0A";
const AMBER = "FACC15";
const INK3 = "6B6355";
const PAPER2 = "FFFFFF";

// Fraunces/Geist não são embebidas no .pptx — degradam para a fonte mais
// próxima no PowerPoint do leitor. Mantém a intenção tipográfica do deck.
const SERIF = "Fraunces";
const SANS = "Geist";

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const MX = 0.9;

type Slide = ReturnType<PptxGenJS["addSlide"]>;

function eyebrow(slide: Slide, text: string, dark: boolean) {
  slide.addText(text.toUpperCase(), {
    x: MX,
    y: 0.7,
    w: SLIDE_W - MX * 2,
    h: 0.4,
    fontFace: SANS,
    fontSize: 11,
    color: dark ? "999999" : INK3,
    charSpacing: 2,
  });
  slide.addShape("line", {
    x: MX,
    y: 1.12,
    w: SLIDE_W - MX * 2,
    h: 0,
    line: { color: dark ? "2A2A2A" : "D4CFC0", width: 0.75 },
  });
}

function statementSlide(
  pptx: PptxGenJS,
  opts: { eyebrow: string; title: string; body?: string; dark?: boolean },
) {
  const dark = opts.dark ?? false;
  const slide = pptx.addSlide();
  slide.background = { color: dark ? INK : CREAM };
  eyebrow(slide, opts.eyebrow, dark);
  slide.addText(opts.title, {
    x: MX,
    y: 1.7,
    w: SLIDE_W - MX * 2,
    h: 2.8,
    fontFace: SERIF,
    fontSize: 48,
    color: dark ? CREAM : INK,
    lineSpacing: 50,
  });
  if (opts.body) {
    slide.addText(opts.body, {
      x: MX,
      y: 4.6,
      w: 8.5,
      h: 2,
      fontFace: SANS,
      fontSize: 16,
      color: dark ? "999999" : INK3,
      lineSpacing: 24,
    });
  }
  return slide;
}

function statCard(
  slide: Slide,
  opts: { x: number; y: number; w: number; label: string; value: string; dark: boolean },
) {
  slide.addText(opts.label.toUpperCase(), {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: 0.4,
    fontFace: SANS,
    fontSize: 10,
    color: opts.dark ? "999999" : INK3,
    charSpacing: 1,
  });
  slide.addText(opts.value, {
    x: opts.x,
    y: opts.y + 0.35,
    w: opts.w,
    h: 1.1,
    fontFace: SERIF,
    fontSize: 40,
    color: opts.dark ? CREAM : INK,
  });
}

export async function buildPptx(deck: DeckData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "DECK", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "DECK";
  pptx.author = "destaque.ai";
  pptx.company = "destaque.ai";
  pptx.title = `Proposta — ${deck.companyName}`;

  const summary = deck.audit?.summary;

  /* ---- 01 Capa ---- */
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM };
    slide.addShape("rect", { x: 0, y: 0, w: 0.18, h: SLIDE_H, fill: { color: AMBER } });
    slide.addText("PROPOSTA · GENERATIVE ENGINE OPTIMIZATION", {
      x: MX,
      y: 1.2,
      w: SLIDE_W - MX * 2,
      h: 0.4,
      fontFace: SANS,
      fontSize: 11,
      color: INK3,
      charSpacing: 2,
    });
    slide.addText(deck.customMessage?.trim() || `Proposta para ${deck.companyName}`, {
      x: MX,
      y: 2.3,
      w: SLIDE_W - MX * 2,
      h: 3,
      fontFace: SERIF,
      fontSize: 54,
      color: INK,
      lineSpacing: 56,
    });
    slide.addText("destaque.ai · Lisboa", {
      x: MX,
      y: 6.3,
      w: 6,
      h: 0.5,
      fontFace: SANS,
      fontSize: 12,
      color: INK3,
    });
  }

  /* ---- 02 O problema ---- */
  statementSlide(pptx, {
    eyebrow: "O problema",
    title: "O ChatGPT recomenda alguém.\nHoje, não é a " + deck.companyName + ".",
    body: "Quando o teu público pergunta a uma IA por um serviço como o teu, há uma resposta — e essa resposta tem nomes.",
    dark: true,
  });

  /* ---- 03 Auditoria · resumo ---- */
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM };
    eyebrow(slide, "Auditoria GEO", false);
    slide.addText("A tua visibilidade, medida", {
      x: MX,
      y: 1.5,
      w: SLIDE_W - MX * 2,
      h: 1,
      fontFace: SERIF,
      fontSize: 38,
      color: INK,
    });
    const cardW = (SLIDE_W - MX * 2 - 0.6) / 3;
    statCard(slide, {
      x: MX,
      y: 3,
      w: cardW,
      label: "Taxa de citação",
      value: summary ? pct(summary.citation_rate) : "—",
      dark: false,
    });
    statCard(slide, {
      x: MX + cardW + 0.3,
      y: 3,
      w: cardW,
      label: "Share of voice",
      value: summary ? pct(summary.share_of_voice) : "—",
      dark: false,
    });
    statCard(slide, {
      x: MX + (cardW + 0.3) * 2,
      y: 3,
      w: cardW,
      label: "Posição média",
      value: summary?.avg_position != null ? `#${summary.avg_position}` : "—",
      dark: false,
    });
    slide.addText(
      `Auditámos ${deck.prompts.length} prompts reais em 4 motores de IA: ${ENGINES.map(
        (e) => ENGINE_LABEL[e],
      ).join(" · ")}.`,
      {
        x: MX,
        y: 5,
        w: SLIDE_W - MX * 2,
        h: 1,
        fontFace: SANS,
        fontSize: 15,
        color: INK3,
      },
    );
  }

  /* ---- 04 Resultados por motor ---- */
  {
    const slide = pptx.addSlide();
    slide.background = { color: INK };
    eyebrow(slide, "Resultados por motor", true);
    slide.addText("Taxa de citação por motor", {
      x: MX,
      y: 1.5,
      w: SLIDE_W - MX * 2,
      h: 1,
      fontFace: SERIF,
      fontSize: 36,
      color: CREAM,
    });
    const cardW = (SLIDE_W - MX * 2 - 0.9) / 4;
    ENGINES.forEach((e, i) => {
      const s = deck.audit?.by_engine?.[e];
      statCard(slide, {
        x: MX + i * (cardW + 0.3),
        y: 3,
        w: cardW,
        label: ENGINE_LABEL[e],
        value: s ? pct(s.citation_rate) : "—",
        dark: true,
      });
    });
  }

  /* ---- 05 Concorrentes ---- */
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM };
    eyebrow(slide, "Concorrência", false);
    slide.addText("Quem a IA cita primeiro", {
      x: MX,
      y: 1.5,
      w: SLIDE_W - MX * 2,
      h: 1,
      fontFace: SERIF,
      fontSize: 36,
      color: INK,
    });
    const tops = summary?.top_competitors?.length
      ? summary.top_competitors
      : deck.competitors;
    (tops.length ? tops : ["—"]).slice(0, 5).forEach((c, i) => {
      slide.addText(
        [
          { text: `${String(i + 1).padStart(2, "0")}   `, options: { color: INK3, fontFace: SANS, fontSize: 14 } },
          { text: c, options: { color: INK, fontFace: SERIF, fontSize: 24 } },
        ],
        { x: MX, y: 2.9 + i * 0.78, w: SLIDE_W - MX * 2, h: 0.7 },
      );
    });
  }

  /* ---- 06 Metodologia ---- */
  {
    const slide = pptx.addSlide();
    slide.background = { color: INK };
    eyebrow(slide, "Metodologia", true);
    slide.addText("Três fases, sem improviso", {
      x: MX,
      y: 1.5,
      w: SLIDE_W - MX * 2,
      h: 1,
      fontFace: SERIF,
      fontSize: 36,
      color: CREAM,
    });
    const phases = [
      ["01 · Diagnóstico", "Onde estás e porquê. 2 semanas."],
      ["02 · Sprint", "Implementação técnica e editorial. 6 semanas."],
      ["03 · Retainer", "Operação e monitorização contínua."],
    ];
    phases.forEach(([h, d], i) => {
      slide.addText(h, {
        x: MX,
        y: 2.9 + i * 1.25,
        w: 4,
        h: 0.5,
        fontFace: SANS,
        fontSize: 13,
        color: AMBER,
        charSpacing: 1,
      });
      slide.addText(d, {
        x: MX + 4.2,
        y: 2.9 + i * 1.25,
        w: SLIDE_W - MX * 2 - 4.2,
        h: 0.6,
        fontFace: SERIF,
        fontSize: 20,
        color: CREAM,
      });
    });
  }

  /* ---- 07 Pricing ---- */
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM };
    eyebrow(slide, "Investimento", false);
    slide.addText("Três fases, um número claro", {
      x: MX,
      y: 1.5,
      w: SLIDE_W - MX * 2,
      h: 1,
      fontFace: SERIF,
      fontSize: 36,
      color: INK,
    });
    const tiers = [
      { name: "Diagnóstico", price: eur(deck.pricing.diagnostico), unit: "one-off" },
      { name: "Sprint", price: eur(deck.pricing.sprint), unit: "one-off", hot: true },
      { name: "Retainer", price: eur(deck.pricing.retainer), unit: "/ mês" },
    ];
    const cardW = (SLIDE_W - MX * 2 - 0.6) / 3;
    tiers.forEach((t, i) => {
      const x = MX + i * (cardW + 0.3);
      slide.addShape("rect", {
        x,
        y: 2.9,
        w: cardW,
        h: 2.9,
        fill: { color: t.hot ? AMBER : PAPER2 },
        line: { color: t.hot ? AMBER : "D4CFC0", width: 1 },
      });
      slide.addText(t.name.toUpperCase(), {
        x: x + 0.3,
        y: 3.15,
        w: cardW - 0.6,
        h: 0.4,
        fontFace: SANS,
        fontSize: 11,
        color: INK3,
        charSpacing: 1,
      });
      slide.addText(t.price, {
        x: x + 0.3,
        y: 3.6,
        w: cardW - 0.6,
        h: 1,
        fontFace: SERIF,
        fontSize: 32,
        color: INK,
      });
      slide.addText(t.unit, {
        x: x + 0.3,
        y: 4.7,
        w: cardW - 0.6,
        h: 0.4,
        fontFace: SANS,
        fontSize: 12,
        color: INK3,
      });
    });
  }

  /* ---- 08 CTA ---- */
  statementSlide(pptx, {
    eyebrow: "Próximo passo",
    title: `Vamos pôr a ${deck.companyName} no mapa da IA.`,
    body: "Agenda uma conversa de 30 minutos · destaque.ai · contacto@destaque.ai",
    dark: true,
  });

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}
