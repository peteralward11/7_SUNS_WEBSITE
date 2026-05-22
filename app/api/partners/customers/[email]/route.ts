import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
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

  const { email } = await params;
  const decoded = decodeURIComponent(email);

  const { data: jobs, error } = await adminClient()
    .from("bookings")
    .select("id, full_name, email, phone, address, preferred_date, appliances, status, created_at, fp_order_number, archived")
    .in("source", ["fisher_paykel", "direct"])
    .ilike("email", decoded)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  if (!jobs || jobs.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latest = jobs[0];
  const customer = {
    email: latest.email ?? decoded,
    full_name: latest.full_name ?? "",
    phone: latest.phone ?? null,
    address: latest.address ?? null,
    jobs,
  };

  return NextResponse.json({ customer });
}
