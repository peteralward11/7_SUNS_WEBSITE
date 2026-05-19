import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import BookingConfirmation from "@/emails/BookingConfirmation";
import BookingNotification from "@/emails/BookingNotification";

const FROM = "bookings@7suns.ca";
const TEAM_EMAIL = "info@7Suns.ca";
const HCP_BASE = "https://api.housecallpro.com";

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
      full_name, email, phone,
      project_type,
      company_name,
      appliance_count,
      address,
      unit_count,
      appliances,
      installation,
      removal,
      elevator,
      stair_carry,
      preferred_date,
      access_notes,
      notes,
    } = body;

    /* ── 1. Validate required fields ── */
    const isBuilder = project_type === "builder";
    if (!full_name || !email || !phone || !address || !appliances?.length || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (isBuilder && !company_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = {
      full_name,
      email,
      phone,
      project_type: project_type ?? "residential",
      company_name: company_name || null,
      appliance_count: appliance_count ?? null,
      address,
      unit_count: unit_count ?? null,
      appliances,
      installation: Boolean(installation),
      removal: Boolean(removal),
      elevator: Boolean(elevator),
      stair_carry: Boolean(stair_carry),
      preferred_date,
      access_notes: access_notes || null,
      notes: notes || null,
    };

    /* ── 2. Save to Supabase ── */
    const { error: dbError } = await supabase.from("bookings").insert(data);
    if (dbError) {
      console.error("[book] Supabase insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    /* ── 3. Send customer confirmation email ── */
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Booking Request Received — 7 Suns Delivery & Logistics",
      react: BookingConfirmation(data),
    });

    /* ── 4. Send internal notification email ── */
    await resend.emails.send({
      from: FROM,
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `New Booking: ${full_name} — ${preferred_date}`,
      react: BookingNotification({ ...data, created_at: new Date().toISOString() }),
    });

    /* ── 5. HousecallPro integration ── */
    try {
      const hcpHeaders = {
        Authorization: `Token ${process.env.HOUSECALL_PRO_API_KEY}`,
        "Content-Type": "application/json",
      };

      const nameParts = full_name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "-";

      const customerRes = await fetch(`${HCP_BASE}/customers`, {
        method: "POST",
        headers: hcpHeaders,
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          mobile_number: phone,
        }),
      });
      const customer = await customerRes.json();

      const appliancesList = Array.isArray(appliances) ? appliances.join(", ") : appliances;
      const description = [
        `Appliances: ${appliancesList}`,
        appliance_count ? `Number of Appliances: ${appliance_count}` : null,
        unit_count ? `Number of Units: ${unit_count}` : null,
        `Installation: ${installation ? "Yes" : "No"}`,
        `Old Unit Removal: ${removal ? "Yes" : "No"}`,
        `Elevator Required: ${elevator ? "Yes" : "No"}`,
        `Stair Carry: ${stair_carry ? "Yes" : "No"}`,
        `Project Type: ${isBuilder ? "Builder/Commercial" : "Residential"}`,
        isBuilder && company_name ? `Company: ${company_name}` : null,
        `Preferred Date: ${preferred_date}`,
        access_notes ? `Access Notes: ${access_notes}` : null,
        notes ? `Notes: ${notes}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await fetch(`${HCP_BASE}/jobs`, {
        method: "POST",
        headers: hcpHeaders,
        body: JSON.stringify({
          customer_id: customer.id,
          address: { street: address },
          description,
          lead_source: "Website",
        }),
      });
    } catch (hcpErr) {
      console.error("[book] HousecallPro error:", hcpErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[book] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
