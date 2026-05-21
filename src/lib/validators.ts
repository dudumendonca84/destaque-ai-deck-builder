import { z } from "zod";

export const prospectSchema = z.object({
  company_name: z.string().min(1, "Empresa obrigatória"),
  company_website: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  contact_role: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("").transform(() => undefined)),
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
  custom_prompts: z
    .array(z.string().min(3, "Prompt demasiado curto"))
    .min(3, "Mínimo 3 prompts")
    .max(7, "Máximo 7 prompts"),
  custom_message: z.string().optional(),
  pricing_diagnostico: z.number().int().min(0).default(4500),
  pricing_sprint: z.number().int().min(0).default(18000),
  pricing_retainer: z.number().int().min(0).default(4500),
});

export type ProposalWizardInput = z.infer<typeof proposalWizardSchema>;
