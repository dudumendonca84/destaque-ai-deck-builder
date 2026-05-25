"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { site } from "@/lib/site";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Slide 20 — CTA accionável.
 * Substitui o "Vamos pôr a tua marca no parágrafo" vago por 3 acções
 * concretas que o prospect pode tomar imediatamente.
 */

export function CTA({ deck, active }: SlideProps) {
  const { cta } = site;

  const onClick = (action: string) => {
    trackEvent(deck.token, { event_type: "cta_clicked", slide_id: action });
  };

  return (
    <SlideShell index={20} total={22} eyebrow="Próxima acção">
      <h2 className="tx-h2" style={{ marginBottom: 12 }}>
        Próximo passo — <em className="mark">três caminhos</em>.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 32, maxWidth: 640 }}>
        Escolhe o que faz sentido agora. Nenhum implica decisão final — só abre conversa.
      </p>

      <div className="cta-grid">
        <motion.a
          className="cta-card"
          href={cta.schedule_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onClick("cta_schedule")}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <span className="cta-card__num">01</span>
          <span className="cta-card__title">Agendar conversa</span>
          <span className="cta-card__desc">
            30 minutos para confirmar contexto, objectivos e âmbito. Sem compromisso.
          </span>
          <span className="cta-card__action">Agendar →</span>
        </motion.a>

        {cta.payment_url && (
          <motion.a
            className="cta-card cta-card--featured"
            href={cta.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onClick("cta_payment")}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="cta-card__num">02</span>
            <span className="cta-card__title">Arrancar o Diagnóstico</span>
            <span className="cta-card__desc">
              Paga directo e arrancamos em 24h. Roadmap entregue em 2 semanas.
            </span>
            <span className="cta-card__action">Pagar →</span>
          </motion.a>
        )}

        <motion.a
          className="cta-card"
          href={`mailto:${cta.email}?subject=Proposta destaque.ai - ${encodeURIComponent(deck.companyName)}`}
          onClick={() => onClick("cta_email")}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span className="cta-card__num">{cta.payment_url ? "03" : "02"}</span>
          <span className="cta-card__title">Email directo</span>
          <span className="cta-card__desc">
            Tens dúvidas específicas? Responde-me em {cta.email}.
          </span>
          <span className="cta-card__action">Enviar →</span>
        </motion.a>
      </div>
    </SlideShell>
  );
}
