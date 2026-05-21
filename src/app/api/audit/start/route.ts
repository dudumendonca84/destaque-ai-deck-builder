import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("proposal_id" in body)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  // Step 10 implementa a auditoria GEO real em background.
  return NextResponse.json({ queued: true, note: "stub — Step 10 pending" });
}
