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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
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

  const { email } = await params;
  const decoded = decodeURIComponent(email);

  const admin = adminClient();

  const [bookingsRes, invoicesRes] = await Promise.all([
    admin
      .from("bookings")
      .select("id, full_name, email, phone, address, preferred_date, appliances, status, created_at, fp_order_number, archived")
      .in("source", ["fisher_paykel", "direct"])
      .ilike("email", decoded)
      .order("created_at", { ascending: false }),
    admin
      .from("fp_invoices")
      .select("booking_id, amount")
      .eq("status", "paid"),
  ]);

  if (bookingsRes.error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  const jobs = bookingsRes.data ?? [];
  if (jobs.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sum paid invoices for this customer's bookings
  const bookingIds = new Set(jobs.map(j => j.id));
  const ltv = (invoicesRes.data ?? [])
    .filter(inv => bookingIds.has(inv.booking_id))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const latest = jobs[0];
  const customer = {
    email: latest.email ?? decoded,
    full_name: latest.full_name ?? "",
    phone: latest.phone ?? null,
    address: latest.address ?? null,
    ltv,
    jobs: jobs.filter(j => j.status !== "contact"),
  };

  return NextResponse.json({ customer });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
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

  const { email } = await params;
  const decoded = decodeURIComponent(email);
  const body = await req.json();
  const updates: Record<string, string> = {};
  if (body.full_name !== undefined) updates.full_name = body.full_name;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.address !== undefined) updates.address = body.address;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  const admin = adminClient();
  const { error } = await admin
    .from("bookings")
    .update(updates)
    .in("source", ["fisher_paykel", "direct"])
    .ilike("email", decoded);

  if (error) {
    console.error("[customers/patch] error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
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

  const { email } = await params;
  const decoded = decodeURIComponent(email);
  const admin = adminClient();

  const { data: bookings } = await admin
    .from("bookings")
    .select("id")
    .in("source", ["fisher_paykel", "direct"])
    .ilike("email", decoded);

  const ids = (bookings ?? []).map(b => b.id);

  if (ids.length > 0) {
    await admin.from("fp_job_activity").delete().in("booking_id", ids);
    await admin.from("fp_job_photos").delete().in("booking_id", ids);
    // Preserve paid invoices so historical revenue totals are unaffected —
    // detach them from the booking rather than deleting them.
    await admin.from("fp_invoices").update({ booking_id: null }).in("booking_id", ids).eq("status", "paid");
    await admin.from("fp_invoices").delete().in("booking_id", ids).neq("status", "paid");
    await admin.from("fp_quotes").delete().in("booking_id", ids);
    await admin.from("bookings").delete().in("id", ids);
  }

  return NextResponse.json({ success: true });
}
