import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import BookingConfirmation from "@/emails/BookingConfirmation";
import FPBookingNotification from "@/emails/FPBookingNotification";

const FROM = "bookings@7suns.ca";
const TEAM_EMAILS = ["john@7suns.ca", "Nick@7suns.ca"];

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY ?? "build-placeholder");
  try {
    const body = await req.json();
    const {
      full_name, email, phone, fp_order_number,
      project_type,
      company_name, site_contact_name, site_contact_phone,
      address, suite_number, floor_number, unit_count,
      appliance_entries,
      installation, removal, elevator, stair_carry,
      access_notes,
      preferred_date, alternate_date,
      time_window, notes,
    } = body;

    /* ── 1. Validate required fields ── */
    if (!full_name || !email || !phone || !fp_order_number || !address || !appliance_entries?.length || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (project_type === "builder" && !company_name) {
      return NextResponse.json({ error: "Company name required for builder bookings" }, { status: 400 });
    }

    /* ── 2. Serialize appliance entries to string array ── */
    const appliances: string[] = (appliance_entries as { type: string; type_other?: string }[]).map(e =>
      e.type === "Other" && e.type_other ? `Other: ${e.type_other}` : e.type
    );

    const data = {
      full_name, email, phone,
      address,
      suite_number: suite_number || null,
      floor_number: floor_number || null,
      appliances,
      installation: Boolean(installation),
      removal: Boolean(removal),
      elevator: Boolean(elevator),
      stair_carry: Boolean(stair_carry),
      access_notes: access_notes || null,
      project_type: project_type ?? "residential",
      company_name: company_name || null,
      unit_count: unit_count || null,
      site_contact_name: site_contact_name || null,
      site_contact_phone: site_contact_phone || null,
      preferred_date,
      alternate_date: alternate_date || null,
      time_window: time_window || null,
      notes: notes || null,
      source: "fisher_paykel",
      fp_order_number,
    };

    /* ── 3. Save to Supabase ── */
    const { error: dbError } = await supabase.from("bookings").insert(data);
    if (dbError) {
      console.error("[book/fp] Supabase insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    /* ── 4. Send customer confirmation email ── */
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your Fisher & Paykel Delivery is Booked — 7 Suns Delivery & Logistics",
      react: BookingConfirmation({ ...data, appliances }),
    });

    /* ── 5. Send internal team notification ── */
    await resend.emails.send({
      from: FROM,
      to: TEAM_EMAILS,
      replyTo: email,
      subject: `New F&P Booking: ${full_name} — ${preferred_date}`,
      react: FPBookingNotification({ ...data, appliances, created_at: new Date().toISOString() }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[book/fp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
