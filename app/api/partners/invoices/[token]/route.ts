import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const { data: invoice } = await supabase
      .from("fp_invoices")
      .select("*, fp_quotes(line_items, total), bookings(full_name, address, preferred_date, fp_order_number)")
      .eq("public_token", token)
      .single();

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("[partners/invoices/token] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
