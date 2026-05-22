import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://7suns.ca";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = adminClient();

  const { data: quote, error: qErr } = await admin
    .from("fp_quotes")
    .select("id, status, booking_id")
    .eq("id", id)
    .single();

  if (qErr || !quote) {
    return NextResponse.redirect(`${SITE}/quote-approved?status=notfound`);
  }

  if (quote.status !== "approved") {
    await admin.from("fp_quotes").update({ status: "approved" }).eq("id", id);
    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", quote.booking_id)
      .eq("status", "quoted");
  }

  return NextResponse.redirect(`${SITE}/quote-approved`);
}
