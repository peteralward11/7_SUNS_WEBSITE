import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const after = req.nextUrl.searchParams.get("after") ?? "";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("bookings")
    .select("id, full_name, address, created_at")
    .eq("source", "fisher_paykel");

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(20);
  return NextResponse.json({ jobs: data ?? [] });
}
