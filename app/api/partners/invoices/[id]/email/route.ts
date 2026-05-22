import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://7suns.ca";

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

  const { data: invoice, error: iErr } = await admin
    .from("fp_invoices")
    .select("id, amount, booking_id, public_token, stripe_checkout_url")
    .eq("id", id)
    .single();

  if (iErr || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("full_name, email")
    .eq("id", invoice.booking_id)
    .single();

  if (bErr || !booking?.email) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const invoicePageUrl = `${SITE}/partners/invoice/${invoice.public_token}`;
  const payUrl = invoice.stripe_checkout_url ?? invoicePageUrl;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111111;padding:28px 32px;">
      <p style="margin:0;color:#E8A33D;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">7 Suns Delivery &amp; Logistics</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Your Invoice</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${booking.full_name ?? "there"},<br/>
        Your invoice from 7 Suns Delivery &amp; Logistics is ready.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">Amount Due</p>
        <p style="margin:0;font-size:36px;font-weight:700;color:#111827;">${fmt(invoice.amount)}</p>
      </div>
      <div style="margin:0 0 0;text-align:center;">
        <a href="${payUrl}" style="display:inline-block;padding:14px 32px;background:#111111;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
          Pay Now →
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Secure payment — takes less than a minute</p>
      </div>
      <p style="margin:32px 0 0;color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #f3f4f6;padding-top:24px;">
        If you have any questions, reply to this email or give us a call.<br/>
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
  const { error: sendErr } = await resend.emails.send({
    from: "7 Suns Delivery & Logistics <noreply@7suns.ca>",
    to: booking.email,
    subject: `Your invoice from 7 Suns Delivery & Logistics — ${fmt(invoice.amount)}`,
    html,
  });

  if (sendErr) {
    console.error("[invoices/email] send error:", sendErr);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  await admin.from("fp_invoices").update({ status: "sent" }).eq("id", id);

  return NextResponse.json({ success: true });
}
