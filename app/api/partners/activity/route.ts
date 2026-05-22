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
  const bookingId = req.nextUrl.searchParams.get("booking_id");
  if (!bookingId) return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminClient()
    .from("fp_job_activity")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await adminClient()
    .from("fp_job_activity")
    .delete()
    .eq("id", id)
    .eq("type", "note");

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  const { data, error } = await adminClient()
    .from("fp_job_activity")
    .update({ content: content.trim() })
    .eq("id", id)
    .eq("type", "note")
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user.email ?? "")
    .single();

  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { booking_id, content } = await req.json();
  if (!booking_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from("fp_job_activity")
    .insert({
      booking_id,
      user_email: user.email,
      user_name: portalUser.name ?? user.email,
      type: "note",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ entry: data });
}
