import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: portalUser } = await supabase
      .from("fp_portal_users")
      .select("is_admin")
      .eq("email", user.email ?? "")
      .single();

    if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { booking_id, quote_id, amount, customer_email, customer_name } = await req.json();
    if (!booking_id || !quote_id || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    /* Create invoice record first to get public_token */
    const { data: invoice, error: insertError } = await supabase
      .from("fp_invoices")
      .insert({ booking_id, quote_id, amount, status: "unpaid" })
      .select()
      .single();

    if (insertError || !invoice) {
      console.error("[partners/invoices] insert error:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const invoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/partners/invoice/${invoice.public_token}`;

    /* Create Stripe Checkout Session if key is available */
    let stripeCheckoutUrl: string | null = null;
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: customer_email,
        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: `7 Suns Delivery & Logistics — ${customer_name}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          booking_id,
          invoice_id: invoice.id,
          public_token: invoice.public_token,
        },
        success_url: `${invoiceUrl}?payment=success`,
        cancel_url: invoiceUrl,
      });
      stripeCheckoutUrl = session.url;

      /* Store Stripe session info */
      await supabase
        .from("fp_invoices")
        .update({ stripe_session_id: session.id, stripe_checkout_url: session.url })
        .eq("id", invoice.id);
    }

    return NextResponse.json({ invoice, invoiceUrl, stripeCheckoutUrl });
  } catch (err) {
    console.error("[partners/invoices] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
