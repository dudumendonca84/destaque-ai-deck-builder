/**
 * Plataformas de tracking/medição GEO conhecidas. Quando a "marca mais
 * citada" nas respostas da categoria é uma destas, NÃO é um concorrente
 * (é um produto que o cliente compraria). Os slides client-facing usam
 * isto para não apresentar uma ferramenta como consultora concorrente —
 * o Landscape (slide 7) classifica-as com contexto; os cards de KPI
 * simplesmente não as destacam como "marca mais citada".
 *
 * Fonte única — espelhada em build-deck.tsx (fallback PDF estático). Quando
 * o print-to-PDF estabilizar e o build-deck for removido, fica só aqui.
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
  "brandlight",
  "scrunch ai",
  "scrunch",
  "goodie ai",
  "goodie",
  "visably",
  "relume",
  "mention.com",
  "mention",
];

export function isGeoTool(brand: string): boolean {
  const norm = brand.trim().toLowerCase();
  return GEO_TOOLS.some((t) => norm === t || norm.startsWith(`${t} `));
}

/**
 * Pontua um peer pela "portugalidade" do positioning_md. Num deck para o
 * mercado PT, os slides de concorrência (Villain, Landscape) têm de
 * liderar com concorrentes PT — não com consultores espanhóis/intl
 * (Aleyda Solis, Human Level, Sico) que a síntese às vezes ordena
 * primeiro. Sinais PT: "[via web search]" (descoberta PT-específica da
 * routine), "PT"/"portugues"/"Lisboa"/"Porto"/"Braga". Sinais
 * estrangeiros: "espanhol"/"(ES)"/"ES/EN"/"mundial"/"internacional".
 * Reordena sem perder ninguém — os dados já lá estão.
 */
export function ptPeerScore(positioning: string | undefined): number {
  const p = (positioning ?? "").toLowerCase();
  let s = 0;
  if (p.includes("[via web search]")) s += 3;
  if (/\bpt\b|portugu|lisboa|porto|braga/.test(p)) s += 2;
  if (/espanh|\(es\)|es\/en|mundial|internacional/.test(p)) s -= 3;
  return s;
}
