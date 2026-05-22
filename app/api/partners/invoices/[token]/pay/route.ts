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
  { params }: { params: Promise<{ token: string }> }
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

  const { token } = await params;
  const admin = adminClient();

  const { data: invoice, error: fetchError } = await admin
    .from("fp_invoices")
    .select("id, booking_id")
    .eq("public_token", token)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("fp_invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("public_token", token);

  if (error) {
    console.error("[invoices/pay] error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Only promote the booking to "paid" if the job is already completed —
  // paying an invoice mid-workflow should not skip operational stages.
  if (invoice.booking_id) {
    const { data: booking } = await admin
      .from("bookings")
      .select("status")
      .eq("id", invoice.booking_id)
      .single();

    if (booking?.status === "completed") {
      const { error: bookingError } = await admin
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", invoice.booking_id);
      if (bookingError) console.error("[invoices/pay] booking update failed:", bookingError);
    }
  }

  return NextResponse.json({ success: true });
}
