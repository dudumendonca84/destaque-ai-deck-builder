import { Resend } from "resend";

export function hasResendKey(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Remetente do email. Para enviar a clientes externos, o domínio tem de
 * estar verificado no Resend e RESEND_FROM apontar para um email desse
 * domínio (ex.: "destaque.ai <contacto@destaque.ai>"). Sem isso, o Resend
 * só permite enviar para o email da própria conta.
 */
function fromAddress(): string {
  return process.env.RESEND_FROM ?? "destaque.ai <onboarding@resend.dev>";
}

type ProposalEmail = {
  to: string;
  companyName: string;
  contactName: string | null;
  proposalUrl: string;
};

function buildHtml({ companyName, contactName, proposalUrl }: ProposalEmail): string {
  const hello = contactName?.trim() ? `Olá ${contactName.trim()},` : "Olá,";
  return `<!doctype html>
<html lang="pt-PT">
<body style="margin:0;padding:0;background:#F5F1E8;">
  <div style="max-width:520px;margin:0 auto;padding:48px 32px;font-family:Georgia,'Times New Roman',serif;color:#0A0A0A;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:-0.5px;margin-bottom:32px;">
      <span style="background:#FACC15;padding:2px 6px;">destaque</span><span style="color:#6B6355;">.ai</span>
    </div>
    <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${hello}</p>
    <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">
      Preparámos uma análise da visibilidade da <strong>${companyName}</strong> nos
      motores de IA — ChatGPT, Claude, Gemini, Grok, Perplexity e Copilot — com uma
      proposta personalizada para a tornar mais citável.
    </p>
    <p style="font-size:16px;line-height:1.5;margin:0 0 28px;">
      Podes ver tudo aqui:
    </p>
    <a href="${proposalUrl}"
       style="display:inline-block;background:#0A0A0A;color:#F5F1E8;text-decoration:none;
              font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;
              letter-spacing:0.5px;text-transform:uppercase;padding:14px 24px;border-radius:999px;">
      Ver a proposta &rarr;
    </a>
    <p style="font-size:13px;line-height:1.5;color:#6B6355;margin:28px 0 0;">
      Ou copia este link:<br/>
      <span style="color:#0A0A0A;">${proposalUrl}</span>
    </p>
    <p style="font-size:13px;line-height:1.5;color:#6B6355;margin:32px 0 0;
              border-top:1px solid #D4CFC0;padding-top:20px;">
      destaque.ai · Generative Engine Optimization · Lisboa
    </p>
  </div>
</body>
</html>`;
}

/** Envia o email da proposta ao prospect. Lança erro com mensagem legível. */
export async function sendProposalEmail(opts: ProposalEmail): Promise<void> {
  if (!hasResendKey()) {
    throw new Error("RESEND_API_KEY não está configurada.");
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: opts.to,
    subject: `Proposta destaque.ai para ${opts.companyName}`,
    html: buildHtml(opts),
  });
  if (error) {
    throw new Error(error.message || "Falha no envio do email.");
  }
}
