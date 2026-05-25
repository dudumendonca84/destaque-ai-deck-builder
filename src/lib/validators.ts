import { z } from "zod";

// Aceita "destaque.ai", "www.destaque.ai", "http://destaque.ai" ou "https://destaque.ai".
// Normaliza para https:// e valida que o resultado é um URL válido.
const flexibleUrl = z
  .string()
  .trim()
  .transform((s) => (s && !/^https?:\/\//i.test(s) ? `https://${s}` : s))
  .pipe(z.string().url("URL inválido"));

const optionalUrl = z
  .string()
  .optional()
  .transform((s) => s?.trim() || undefined)
  .pipe(flexibleUrl.optional());

export const prospectSchema = z.object({
  company_name: z.string().min(1, "Empresa obrigatória"),
  company_website: optionalUrl,
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  contact_role: z.string().optional(),
  linkedin_url: optionalUrl,
  business_type: z.string().optional(),
  location: z.string().optional(),
  target_audience: z.string().optional(),
  competitors: z.string().optional(), // CSV no formulário, convertido a array
  notes: z.string().optional(),
  source: z.string().optional(),
  status: z
    .enum(["lead", "contacted", "opened", "replied", "scheduled", "won", "lost"])
    .default("lead"),
});

export type ProspectInput = z.infer<typeof prospectSchema>;

export function parseCompetitors(csv?: string): string[] | null {
  if (!csv?.trim()) return null;
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const proposalWizardSchema = z.object({
  prospect_id: z.string().uuid("Prospect inválido"),
  audit_tier: z.enum(["free", "diagnostic", "premium"]).default("free"),
  custom_prompts: z
    .array(z.string().min(3, "Prompt demasiado curto"))
    .min(3, "Mínimo 3 prompts")
    .max(30, "Máximo 30 prompts"),
  custom_message: z.string().optional(),
  pricing_diagnostico: z.number().int().min(0).default(4500),
  pricing_sprint: z.number().int().min(0).default(18000),
  pricing_retainer: z.number().int().min(0).default(4500),
});

export type ProposalWizardInput = z.infer<typeof proposalWizardSchema>;
