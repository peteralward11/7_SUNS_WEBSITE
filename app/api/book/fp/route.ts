import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import BookingConfirmation from "@/emails/BookingConfirmation";
import FPBookingNotification from "@/emails/FPBookingNotification";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "bookings@7suns.ca";
const TEAM_EMAILS = ["john@7suns.ca", "Nick@7suns.ca"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name, email, phone, fp_order_number,
      address, appliances, installation, removal, elevator, project_type,
      preferred_date, alternate_date, notes,
    } = body;

    /* ── 1. Validate required fields ── */
    if (!full_name || !email || !phone || !fp_order_number || !address || !appliances?.length || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = {
      full_name, email, phone,
      address,
      appliances,
      installation: Boolean(installation),
      removal: Boolean(removal),
      elevator: Boolean(elevator),
      project_type: project_type ?? "residential",
      preferred_date,
      alternate_date: alternate_date || null,
      notes: notes || null,
      source: "fisher_paykel",
      fp_order_number,
    };

    /* ── 2. Save to Supabase ── */
    const { error: dbError } = await supabase.from("bookings").insert(data);
    if (dbError) {
      console.error("[book/fp] Supabase insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    /* ── 3. Send customer confirmation email ── */
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your Fisher & Paykel Delivery is Booked — 7 Suns Delivery & Logistics",
      react: BookingConfirmation(data),
    });

    /* ── 4. Send internal team notification ── */
    await resend.emails.send({
      from: FROM,
      to: TEAM_EMAILS,
      replyTo: email,
      subject: `New F&P Booking: ${full_name} — ${preferred_date}`,
      react: FPBookingNotification({ ...data, created_at: new Date().toISOString() }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[book/fp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
