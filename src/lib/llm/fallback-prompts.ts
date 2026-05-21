// Fallback determinístico — usado quando a chamada a Claude falha
// ou em desenvolvimento sem ANTHROPIC_API_KEY. Não pretende substituir
// a geração real; serve apenas para manter o wizard funcional.

type Ctx = {
  business_type?: string | null;
  location?: string | null;
  company_name?: string | null;
  target_audience?: string | null;
};

export function fallbackPrompts(ctx: Ctx): string[] {
  const biz = ctx.business_type?.trim() || "este negócio";
  const loc = ctx.location?.trim();
  const aud = ctx.target_audience?.trim();
  const locSuffix = loc ? ` em ${loc}` : "";
  const audSuffix = aud ? ` para ${aud}` : "";

  return [
    `Melhor ${biz}${locSuffix}`,
    `Onde contratar ${biz}${locSuffix} preços`,
    `${biz} recomendado${audSuffix}${locSuffix}`,
    `Comparar ${biz}${locSuffix}`,
    `${biz} avaliações${locSuffix}`,
  ];
}
