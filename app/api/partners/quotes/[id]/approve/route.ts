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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = adminClient();

  const { data: quote, error: qErr } = await admin
    .from("fp_quotes")
    .select("id, status, booking_id")
    .eq("id", id)
    .single();

  if (qErr || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  await admin.from("fp_quotes").update({ status: "approved" }).eq("id", id);
  await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", quote.booking_id)
    .in("status", ["quoted", "sent"]);

  return NextResponse.json({ success: true });
}
