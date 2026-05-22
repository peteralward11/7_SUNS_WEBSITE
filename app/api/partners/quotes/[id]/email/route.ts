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

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
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
    .select("id, line_items, total, booking_id")
    .eq("id", id)
    .single();

  if (qErr || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("full_name, email")
    .eq("id", quote.booking_id)
    .single();

  if (bErr || !booking?.email) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const lineItems = quote.line_items as { description: string; amount: string }[];

  const rows = lineItems
    .map(li => `
      <tr>
        <td style="padding:8px 0;color:#374151;font-size:14px;border-bottom:1px solid #f3f4f6;">${li.description || "—"}</td>
        <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${fmt(parseFloat(li.amount) || 0)}</td>
      </tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111111;padding:28px 32px;">
      <p style="margin:0;color:#E8A33D;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">7 Suns Appliances</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Your Quote</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${booking.full_name ?? "there"},<br/>
        Here's a summary of your quote from 7 Suns Appliances.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:0 0 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Description</th>
            <th style="padding:0 0 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#111827;">Total</td>
            <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#111827;text-align:right;">${fmt(quote.total)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin:32px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
        If you have any questions, reply to this email or give us a call.<br/>
        Thank you for choosing 7 Suns Appliances.
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">7 Suns Appliances &mdash; 7suns.ca</p>
    </div>
  </div>
</body>
</html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendErr } = await resend.emails.send({
    from: "7 Suns Appliances <noreply@7suns.ca>",
    to: booking.email,
    subject: `Your quote from 7 Suns Appliances — ${fmt(quote.total)}`,
    html,
  });

  if (sendErr) {
    console.error("[quotes/email] send error:", sendErr);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
