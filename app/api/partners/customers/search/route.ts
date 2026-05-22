import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ customers: [] });

  const { data, error } = await adminClient()
    .from("bookings")
    .select("full_name, email, phone")
    .in("source", ["fisher_paykel", "direct"])
    .neq("status", "contact")
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  // Deduplicate by email, keeping most recent name + phone
  const seen = new Map<string, { full_name: string; email: string; phone: string | null }>();
  for (const row of data ?? []) {
    const key = (row.email ?? "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.set(key, { full_name: row.full_name ?? "", email: row.email ?? "", phone: row.phone ?? null });
  }

  return NextResponse.json({ customers: Array.from(seen.values()).slice(0, 10) });
}
