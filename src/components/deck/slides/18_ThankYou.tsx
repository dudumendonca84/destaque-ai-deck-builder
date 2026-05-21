"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "../types";
import { trackEvent } from "@/lib/analytics/track";
import { site } from "@/lib/site";

export function ThankYou({ deck }: SlideProps) {
  return (
    <div className="slide" data-tone="ink">
      <div className="slide__inner slide__inner--center">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 24 }}
        >
          <span className="num">18 / 18</span>
          <span className="bar" />
          <span>Vamos a isto</span>
        </motion.div>

        <motion.h2
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 880 }}
        >
          Obrigado, <em className="mark">{deck.companyName}</em>.
        </motion.h2>

        <motion.a
          className="btn-big"
          href={`/proposta/${deck.token}/agendar`}
          onClick={() =>
            trackEvent(deck.token, { event_type: "cta_clicked", slide_number: 18, slide_id: "thank-you" })
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          style={{ marginTop: 32 }}
        >
          <span>Agendar conversa · 30 min</span>
          <span className="arrow">→</span>
        </motion.a>

        <motion.p
          className="body-m"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          style={{ marginTop: 28, color: "var(--ink-4)" }}
        >
          {site.email} · {site.city}, {site.country}
        </motion.p>
      </div>
    </div>
  );
}
