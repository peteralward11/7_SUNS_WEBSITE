import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: portalUser } = await supabase
      .from("fp_portal_users")
      .select("is_admin")
      .eq("email", user.email ?? "")
      .single();

    if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { status } = await req.json();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .eq("source", "fisher_paykel");

    if (error) {
      console.error("[partners/bookings] update error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[partners/bookings] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
