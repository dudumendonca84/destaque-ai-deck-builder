import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <Sidebar adminEmail={user.email ?? null} />
      <div className="admin-main">
        {children}
        <footer className="admin-footer">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>build · deck-builder/0.1</span>
        </footer>
      </div>
    </div>
  );
}
