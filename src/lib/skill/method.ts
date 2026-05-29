import { loadSkillFile } from "./loader";

/**
 * Fetches o método SINAL client-facing da skill (`SKILL.md` →
 * `## Deck Builder method`): a expansão SINAL, o glossário de acrónimos e
 * as 8 dimensões. Princípio "skill é o cérebro": o deck não inventa o
 * método — lê-o vivo da skill (Slides 06 e 07). Se a secção faltar ou vier
 * incompleta, cai para o fallback hardcoded (paridade offline).
 */

export type Acronym = { sigla: string; nome: string; definicao: string };
export type Dimension = { n: string; dimensao: string; foco: string };
export type Method = {
  sinal: string;
  glossary: Acronym[];
  dimensions: Dimension[];
};

/**
 * Fallback hardcoded — alinhado com `## Deck Builder method` em SKILL.md à
 * data do last refresh. Usado se o fetch falhar ou a secção vier incompleta.
 */
const FALLBACK_METHOD: Method = {
  sinal: "Sistema Integrado destaque.ai de Notabilidade em AI search e LLMs.",
  glossary: [
    {
      sigla: "SEO",
      nome: "Search Engine Optimization",
      definicao: "Pesquisa clássica — Google, Bing. A base sobre a qual o GEO se constrói.",
    },
    {
      sigla: "GEO",
      nome: "Generative Engine Optimization",
      definicao: "Aparecer em respostas geradas por IA — ChatGPT, Claude, Gemini, Grok.",
    },
    {
      sigla: "AEO",
      nome: "Answer Engine Optimization",
      definicao: "Otimizar para resposta directa — featured snippets, voz, AI Overviews.",
    },
  ],
  dimensions: [
    { n: "1", dimensao: "Fundação técnica", foco: "Schema, llms.txt, crawlers de IA, performance, HTML renderizado pelo servidor." },
    { n: "2", dimensao: "Conteúdo e autoridade temática", foco: "Clusters de tópicos, cadência editorial, dados e estatísticas próprias." },
    { n: "3", dimensao: "Entidade e marca", foco: "Wikidata, Wikipedia, Knowledge Panel, sameAs, consistência NAP." },
    { n: "4", dimensao: "Autoridade e PR digital", foco: "Cobertura Tier-1, podcasts, conferências, qualidade do link graph." },
    { n: "5", dimensao: "Sinais sociais e comunidade", foco: "LinkedIn, GitHub, Reddit, X — plataformas que a IA cita." },
    { n: "6", dimensao: "Sinais de autoridade no site", foco: "Autores com schema Person, sinais E-E-A-T, casos verificáveis." },
    { n: "7", dimensao: "Medição e feedback", foco: "GSC, GA4 (canal IA), Bing AI Performance, auditorias mensais." },
    { n: "8", dimensao: "Posicionamento estratégico", foco: "Share-of-voice, estratégia no-click, mapeamento ao funil." },
  ],
};

const METHOD_HEADER = "## Deck Builder method";

function parseCells(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim().replace(/^`|`$/g, ""));
}

/**
 * Parse as duas tabelas dentro de `## Deck Builder method`. Classifica cada
 * tabela pelo seu cabeçalho (`sigla` → glossário; `dimensao` → dimensões).
 * Linhas não-tabela (separador, headings, prosa) são ignoradas.
 */
function parseMethodTables(section: string): { glossary: Acronym[]; dimensions: Dimension[] } {
  const glossary: Acronym[] = [];
  const dimensions: Dimension[] = [];
  let mode: "none" | "glossary" | "dims" = "none";

  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    if (/^\|[\s\-:|]+\|$/.test(line)) continue; // separador
    const cells = parseCells(line);
    const lower = cells.map((c) => c.toLowerCase());
    if (lower.includes("sigla")) {
      mode = "glossary";
      continue;
    }
    if (lower.includes("dimensao") || lower.includes("dimensão")) {
      mode = "dims";
      continue;
    }
    if (cells.length < 3) continue;
    if (mode === "glossary") {
      const [sigla, nome, definicao] = cells;
      if (sigla && nome && definicao) glossary.push({ sigla, nome, definicao });
    } else if (mode === "dims") {
      const [n, dimensao, foco] = cells;
      if (n && dimensao && foco) dimensions.push({ n, dimensao, foco });
    }
  }
  return { glossary, dimensions };
}

export async function loadMethod(): Promise<{ method: Method; source: "skill" | "fallback" }> {
  const result = await loadSkillFile({ path: "SKILL.md", fallback: "" });
  if (result.source === "fallback" || !result.body) {
    return { method: FALLBACK_METHOD, source: "fallback" };
  }

  const idx = result.body.indexOf(METHOD_HEADER);
  if (idx < 0) return { method: FALLBACK_METHOD, source: "fallback" };

  let section = result.body.slice(idx + METHOD_HEADER.length);
  const nextHeading = section.indexOf("\n## ");
  if (nextHeading >= 0) section = section.slice(0, nextHeading);

  const sinalMatch = section.match(/^SINAL:\s*(.+)$/m);
  const { glossary, dimensions } = parseMethodTables(section);

  // Skill alcançável mas secção ausente/incompleta → fallback seguro.
  if (glossary.length < 3 || dimensions.length < 8) {
    return { method: FALLBACK_METHOD, source: "fallback" };
  }

  return {
    method: {
      sinal: sinalMatch?.[1]?.trim() || FALLBACK_METHOD.sinal,
      glossary,
      dimensions,
    },
    source: "skill",
  };
}
