import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("audit_status,audit_started_at,audit_completed_at,audit_results")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    audit_status: data.audit_status,
    audit_started_at: data.audit_started_at,
    audit_completed_at: data.audit_completed_at,
    has_results: Boolean(data.audit_results),
  });
}
