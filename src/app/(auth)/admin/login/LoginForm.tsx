"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInWithPassword, initial);

  if (state.ok) {
    router.push("/admin");
    router.refresh();
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
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.error && <span className="error">{state.error}</span>}
      </div>
      <button className="btn-big" type="submit" disabled={pending}>
        <span>{pending ? "A entrar…" : "Entrar"}</span>
        <span className="arrow">→</span>
      </button>
    </form>
  );
}
