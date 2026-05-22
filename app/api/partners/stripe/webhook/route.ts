import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/* Raw body required for Stripe signature verification */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { booking_id, invoice_id } = session.metadata ?? {};

    if (booking_id && invoice_id) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const [invRes, bookRes] = await Promise.all([
        supabase
          .from("fp_invoices")
          .update({
            status: "paid",
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoice_id),

        supabase
          .from("bookings")
          .update({ status: "paid" })
          .eq("id", booking_id),
      ]);

      if (invRes.error)  console.error("[stripe/webhook] invoice update failed:", invRes.error);
      if (bookRes.error) console.error("[stripe/webhook] booking update failed:", bookRes.error);
    }
  }

  return NextResponse.json({ received: true });
}
