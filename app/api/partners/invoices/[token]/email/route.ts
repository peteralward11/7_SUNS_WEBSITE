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

  const { data: invoice, error: iErr } = await admin
    .from("fp_invoices")
    .select("id, amount, status, public_token, booking_id, quote_id, stripe_checkout_url, fp_quotes(line_items, total)")
    .eq("public_token", token)
    .single();

  if (iErr || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("full_name, email")
    .eq("id", invoice.booking_id)
    .single();

  if (bErr || !booking?.email) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const invoiceUrl = `${SITE}/partners/invoice/${invoice.public_token}`;
  const payUrl = invoice.stripe_checkout_url ?? invoiceUrl;

  const quoteData = (Array.isArray(invoice.fp_quotes) ? invoice.fp_quotes[0] : invoice.fp_quotes) as { line_items: { description: string; amount: string }[]; total: number } | null | undefined;
  const lineItems = quoteData?.line_items ?? [];

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
      <p style="margin:0;color:#E8A33D;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">7 Suns Delivery &amp; Logistics</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Your Invoice</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Hi ${booking.full_name ?? "there"},<br/>
        Thank you for choosing 7 Suns Delivery &amp; Logistics. Here is your invoice for services completed.
      </p>
      ${rows ? `
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
            <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#111827;">Total Due</td>
            <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#111827;text-align:right;">${fmt(invoice.amount)}</td>
          </tr>
        </tfoot>
      </table>
      ` : `
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-top:2px solid #e5e7eb;">
        <span style="font-size:15px;font-weight:700;color:#111827;">Total Due</span>
        <span style="font-size:15px;font-weight:700;color:#111827;">${fmt(invoice.amount)}</span>
      </div>
      `}

      <div style="margin:32px 0 0;text-align:center;">
        <a href="${payUrl}" style="display:inline-block;padding:14px 32px;background:#111111;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
          Pay Now →
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Secure payment — no account needed</p>
      </div>

      <p style="margin:32px 0 0;color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #f3f4f6;padding-top:24px;">
        If you have any questions, reply to this email or give us a call.<br/>
        Thank you for your business.
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

  await admin.from("fp_invoices").update({ status: "sent" }).eq("public_token", token);

  return NextResponse.json({ success: true });
}
