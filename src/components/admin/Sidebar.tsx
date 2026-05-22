"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/prospects", label: "Prospects", Icon: Users },
  { href: "/admin/proposals", label: "Propostas", Icon: FileText },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ adminEmail }: { adminEmail: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <Logo size={22} />
        <span className="admin-sidebar__role">Deck Builder · Admin</span>
      </div>

      <nav className="admin-nav" aria-label="Admin">
        <span className="admin-nav__group">Navegação</span>
        {NAV.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`admin-nav__item${isActive(pathname, href, exact) ? " active" : ""}`}
          >
            <Icon className="icon" strokeWidth={1.5} aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar__foot">
        {adminEmail ? <span>{adminEmail}</span> : null}
        <form action="/admin/logout" method="post">
          <button type="submit" style={{ color: "inherit" }}>
            Sair →
          </button>
        </form>
      </div>
    </aside>
  );
}
