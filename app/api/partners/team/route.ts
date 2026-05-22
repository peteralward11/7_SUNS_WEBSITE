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

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  return portalUser?.is_admin ? user : null;
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await adminClient()
    .from("fp_team_members")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, role, color, email } = await req.json();
  if (!name?.trim() || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data, error } = await adminClient()
    .from("fp_team_members")
    .insert({ name: name.trim(), role, color: color ?? "#E8A33D", email: email?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ member: data });
}
