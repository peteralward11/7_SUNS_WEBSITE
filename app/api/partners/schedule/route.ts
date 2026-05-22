import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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

function timeWindowToTimes(tw: string): { time_start: string; time_end: string } {
  if (tw === "Afternoon") return { time_start: "12:00", time_end: "16:00" };
  if (tw === "Anytime") return { time_start: "08:00", time_end: "16:00" };
  return { time_start: "08:00", time_end: "12:00" }; // Morning default
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function fmtWindow(tw: string) {
  if (tw === "Morning") return "Morning (8am – 12pm)";
  if (tw === "Afternoon") return "Afternoon (12pm – 4pm)";
  return "Anytime (8am – 4pm)";
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const admin = adminClient();

  // Single-booking query (from job drawer)
  const bookingId = searchParams.get("booking_id");
  if (bookingId) {
    const { data, error } = await admin
      .from("fp_job_assignments")
      .select(`
        id, scheduled_date, time_start, time_end, booking_id, team_member_id,
        fp_team_members ( id, name, role, color )
      `)
      .eq("booking_id", bookingId)
      .order("scheduled_date");
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ assignments: data ?? [] });
  }

  // Date-range query (from calendar)
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "Missing start/end params" }, { status: 400 });

  const { data, error } = await admin
    .from("fp_job_assignments")
    .select(`
      id, scheduled_date, time_start, time_end, booking_id, team_member_id,
      fp_team_members ( id, name, role, color ),
      bookings ( id, full_name, address, appliances, status, fp_order_number, email, phone )
    `)
    .gte("scheduled_date", start)
    .lte("scheduled_date", end)
    .order("time_start");

  if (error) {
    console.error("[schedule/GET]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ assignments: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { booking_id, team_member_id, scheduled_date, time_window } = body;

  if (!booking_id || !team_member_id || !scheduled_date || !time_window) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = adminClient();
  const { time_start, time_end } = timeWindowToTimes(time_window);

  // Check if this booking already has an assignment for this team member on this date
  const { data: existing } = await admin
    .from("fp_job_assignments")
    .select("id")
    .eq("booking_id", booking_id)
    .eq("team_member_id", team_member_id)
    .eq("scheduled_date", scheduled_date)
    .single();

  let assignment;
  if (existing) {
    const { data, error } = await admin
      .from("fp_job_assignments")
      .update({ time_start, time_end })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    assignment = data;
  } else {
    const { data, error } = await admin
      .from("fp_job_assignments")
      .insert({ booking_id, team_member_id, scheduled_date, time_start, time_end })
      .select()
      .single();
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    assignment = data;
  }

  // Update booking status to scheduled
  await admin.from("bookings").update({ status: "scheduled" }).eq("id", booking_id);

  // Fetch booking for email
  const { data: booking } = await admin
    .from("bookings")
    .select("full_name, email, address")
    .eq("id", booking_id)
    .single();

  // Send confirmation email
  if (booking?.email) {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111111;padding:28px 32px;">
      <p style="margin:0;color:#E8A33D;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">7 Suns Delivery &amp; Logistics</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Appointment Confirmed</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${booking.full_name ?? "there"},<br/>
        Great news — your appointment with 7 Suns Delivery &amp; Logistics has been confirmed.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;width:110px;">Date</td>
            <td style="padding:6px 0;font-size:15px;font-weight:600;color:#111827;">${fmtDate(scheduled_date)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;">Time</td>
            <td style="padding:6px 0;font-size:15px;font-weight:600;color:#111827;">${fmtWindow(time_window)}</td>
          </tr>
          ${booking.address ? `<tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#374151;">${booking.address}</td>
          </tr>` : ""}
        </table>
      </div>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #f3f4f6;padding-top:24px;">
        Our team will be in touch if anything changes. If you have any questions, reply to this email or give us a call.<br/><br/>
        Thank you for choosing 7 Suns Delivery &amp; Logistics.
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">7 Suns Delivery &amp; Logistics &mdash; 7suns.ca</p>
    </div>
  </div>
</body>
</html>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "7 Suns Delivery & Logistics <noreply@7suns.ca>",
      to: booking.email,
      subject: `Your appointment is confirmed — ${fmtDate(scheduled_date)}`,
      html,
    }).catch(err => console.error("[schedule/email] send error:", err));
  }

  return NextResponse.json({ assignment, success: true });
}
