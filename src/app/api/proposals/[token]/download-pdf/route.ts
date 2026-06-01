import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { createServiceClient } from "@/lib/supabase/server";
import { buildPdf } from "@/lib/pdf/build-deck";
import type { DeckData } from "@/components/deck/types";
import type {
  AuditResults,
  AuditRun,
  AuditTier,
  Proposal,
  Prospect,
} from "@/lib/supabase/types";
import { loadCoreBenchmarks } from "@/lib/skill/benchmarks";
import { loadMethod } from "@/lib/skill/method";
import type { ScanResult } from "@/lib/scan/types";
import type { SynthesizedDeck } from "@/lib/llm/synthesize-deck";

// Chromium headless (Vercel) precisa do runtime Node + tempo para arrancar.
export const runtime = "nodejs";
export const maxDuration = 60;

// Dimensão da página = canvas de design do slide (16:9). Tem de bater com
// .print-page no globals.css e com @page em print.
const PAGE_W = 1280;
const PAGE_H = 720;

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "proposta"
  );
}

/** Assembla DeckData — só usado no fallback (PDF estático antigo). */
async function assembleDeck(token: string): Promise<DeckData | null> {
  const supabase = createServiceClient();
  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("*")
    .eq("token", token)
    .is("deleted_at", null)
    .single();
  if (!proposalRow) return null;
  const proposal = proposalRow as Proposal;

  const { data: prospectRow } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", proposal.prospect_id)
    .single();
  const prospect = prospectRow as Prospect | null;

  const { data: runRows } = await supabase
    .from("audit_runs")
    .select("*")
    .eq("proposal_id", proposal.id);

  const { items: benchmarks } = await loadCoreBenchmarks();
  const { method } = await loadMethod();

  const { data: scanRow } = await supabase
    .from("sinal_scans")
    .select("scan_results")
    .eq("proposal_id", proposal.id)
    .maybeSingle();
  const sinalScan = (scanRow?.scan_results as ScanResult | null) ?? null;

  return {
    token,
    companyName: prospect?.company_name ?? "a tua marca",
    businessType: prospect?.business_type ?? null,
    location: prospect?.location ?? null,
    customMessage: proposal.custom_message,
    auditTier: (proposal.audit_tier as AuditTier | undefined) ?? "free",
    pricing: {
      diagnostico: proposal.pricing_diagnostico,
      sprint: proposal.pricing_sprint,
      retainer: proposal.pricing_retainer,
    },
    prompts: proposal.custom_prompts ?? [],
    competitors: prospect?.competitors ?? [],
    audit: (proposal.audit_results as AuditResults | null) ?? null,
    auditRuns: (runRows ?? []) as AuditRun[],
    benchmarks,
    method,
    sinalScan,
    synthesized: (proposal.deck_blocks as SynthesizedDeck | null) ?? null,
  };
}

function companyNameFor(token: string, deck: DeckData | null): string {
  return deck?.companyName ?? token;
}

/**
 * Imprime o deck web (rota /proposta/[token]/print) via chromium headless.
 * web == PDF por construção: mesmos slides, mesma ordem, mesmo conteúdo,
 * mesmos números — drift impossível. Fontes embebidas automaticamente
 * (o chromium renderiza a página real com next/font).
 *
 * Fallback: se o chromium falhar (cold start, OOM, indisponível em dev),
 * cai no PDF estático antigo (build-deck.tsx) — produção nunca devolve um
 * PDF partido. Remover o fallback + build-deck.tsx quando o print
 * estabilizar em produção.
 */
export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const origin = new URL(request.url).origin;
  const printUrl = `${origin}/proposta/${token}/print`;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: PAGE_W, height: PAGE_H, deviceScaleFactor: 2 },
    });
    try {
      const page = await browser.newPage();
      const res = await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 45_000 });
      if (!res || !res.ok()) {
        throw new Error(`print route ${res?.status() ?? "no-response"}`);
      }
      // Settle: hidratação + fontes + estado final das animações.
      await new Promise((r) => setTimeout(r, 1200));
      // Página PDF = exactamente 1280×720, margens zero. NÃO usar
      // preferCSSPageSize: combinado com width/height fazia o chromium
      // ignorar as dimensões e paginar por tamanho default (Letter) →
      // 2 slides por página (44 slides saíam em 22 páginas). Com width/
      // height explícitos + margin 0, cada .print-page (720px + break-
      // after:page) mapeia 1:1 para uma página PDF.
      const pdf = await page.pdf({
        width: `${PAGE_W}px`,
        height: `${PAGE_H}px`,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      const filename = `proposta-${slug(token)}.pdf`;
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    // Fallback estático — produção nunca devolve PDF partido.
    console.error("[download-pdf] chromium falhou, fallback para build-deck estático:", err);
    const deck = await assembleDeck(token);
    if (!deck) return new Response("Proposta não encontrada", { status: 404 });
    const buffer = await buildPdf(deck);
    const filename = `proposta-${slug(companyNameFor(token, deck))}.pdf`;
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  }
}
