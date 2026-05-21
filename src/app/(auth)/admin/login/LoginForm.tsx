"use client";

import { useActionState } from "react";
import { requestMagicLink, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(requestMagicLink, initial);

  if (state.ok) {
    return (
      <div>
        <p className="body-m" style={{ color: "var(--ink-2)", marginBottom: 12 }}>
          Enviámos-te um <em className="mark">link mágico</em>. Verifica o email para entrar.
        </p>
        <div className="foot">Podes fechar esta janela.</div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="contacto@destaque.ai"
        />
        {state.error && <span className="error">{state.error}</span>}
      </div>
      <button className="btn-big" type="submit" disabled={pending}>
        <span>{pending ? "A enviar…" : "Enviar magic link"}</span>
        <span className="arrow">→</span>
      </button>
    </form>
  );
}
