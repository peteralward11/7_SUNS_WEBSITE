import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("source", "fisher_paykel")
    .single();

  if (error || !booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [photosRes, quoteRes, invoiceRes] = await Promise.all([
    supabase.from("fp_job_photos").select("*").eq("booking_id", id).order("created_at", { ascending: true }),
    supabase.from("fp_quotes").select("*").eq("booking_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("fp_invoices").select("*").eq("booking_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const invoiceUrl = invoiceRes.data?.public_token
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/partners/invoice/${invoiceRes.data.public_token}`
    : null;

  return NextResponse.json({
    booking,
    photos: photosRes.data ?? [],
    quote: quoteRes.data ?? null,
    invoice: invoiceRes.data ?? null,
    invoiceUrl,
  });
}
