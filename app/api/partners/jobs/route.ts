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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    full_name, email, phone, address,
    project_type,
    company_name, site_contact_name, site_contact_phone,
    suite_number, floor_number, unit_count,
    appliances,
    installation, removal, elevator, stair_carry,
    access_notes,
    preferred_date, alternate_date, time_window,
    notes,
    fp_order_number,
  } = body;

  if (!full_name || !email || !phone || !address || !preferred_date || !appliances?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (project_type === "builder" && !company_name) {
    return NextResponse.json({ error: "Company name required for builder jobs" }, { status: 400 });
  }

  const admin = adminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      full_name,
      email,
      phone,
      address,
      project_type: project_type ?? "residential",
      company_name: company_name || null,
      site_contact_name: site_contact_name || null,
      site_contact_phone: site_contact_phone || null,
      suite_number: suite_number || null,
      floor_number: floor_number || null,
      unit_count: unit_count || null,
      appliances,
      installation: Boolean(installation),
      removal: Boolean(removal),
      elevator: Boolean(elevator),
      stair_carry: Boolean(stair_carry),
      access_notes: access_notes || null,
      preferred_date,
      alternate_date: alternate_date || null,
      time_window: time_window || null,
      notes: notes || null,
      fp_order_number: fp_order_number || null,
      source: "direct",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[partners/jobs] insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ id: booking.id });
}
