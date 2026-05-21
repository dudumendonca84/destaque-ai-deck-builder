import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

export function Topbar({ crumbs, actions }: { crumbs: Crumb[]; actions?: ReactNode }) {
  return (
    <div className="admin-topbar">
      <div className="admin-topbar__crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
            {c.href ? <a href={c.href}>{c.label}</a> : <b>{c.label}</b>}
          </span>
        ))}
      </div>
      {actions ? <div style={{ display: "flex", gap: 12 }}>{actions}</div> : null}
    </div>
  );
}
