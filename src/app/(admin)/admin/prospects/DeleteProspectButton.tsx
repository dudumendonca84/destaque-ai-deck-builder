"use client";

import { deleteProspect } from "./actions";

export function DeleteProspectButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProspect.bind(null, id)}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Apagar "${name}" e todas as propostas associadas? Esta acção é irreversível.`,
        );
        if (!ok) e.preventDefault();
      }}
      style={{ display: "inline-block", marginLeft: 12 }}
    >
      <button
        type="submit"
        className="link-arrow"
        style={{
          background: "none",
          border: 0,
          padding: 0,
          cursor: "pointer",
          color: "var(--ink-3)",
          fontFamily: "inherit",
          fontSize: "inherit",
        }}
      >
        Apagar
      </button>
    </form>
  );
}
