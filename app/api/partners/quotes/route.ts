import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { booking_id, line_items, total } = await req.json();
    if (!booking_id || !line_items?.length || typeof total !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: quote, error } = await supabase
      .from("fp_quotes")
      .insert({ booking_id, line_items, total, status: "draft" })
      .select()
      .single();

    if (error) {
      console.error("[partners/quotes] insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    /* Auto-advance booking status to quoted */
    await supabase
      .from("bookings")
      .update({ status: "quoted" })
      .eq("id", booking_id);

    return NextResponse.json({ quote });
  } catch (err) {
    console.error("[partners/quotes] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
