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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: bookings, error } = await adminClient()
    .from("bookings")
    .select("id, full_name, email, address, preferred_date, status, created_at, archived")
    .eq("source", "fisher_paykel")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  // Group by email into customer records
  const map = new Map<string, {
    email: string;
    full_name: string;
    address: string | null;
    job_count: number;
    last_job_date: string;
    first_job_date: string;
    job_ids: string[];
  }>();

  for (const b of bookings ?? []) {
    const key = (b.email ?? "").toLowerCase();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.job_count++;
      existing.job_ids.push(b.id);
      if (b.created_at > existing.last_job_date) {
        existing.last_job_date = b.created_at;
        existing.full_name = b.full_name ?? existing.full_name;
      }
      if (b.created_at < existing.first_job_date) {
        existing.first_job_date = b.created_at;
      }
    } else {
      map.set(key, {
        email: b.email ?? key,
        full_name: b.full_name ?? "",
        address: b.address ?? null,
        job_count: 1,
        last_job_date: b.created_at,
        first_job_date: b.created_at,
        job_ids: [b.id],
      });
    }
  }

  const customers = Array.from(map.values()).sort(
    (a, b) => b.last_job_date.localeCompare(a.last_job_date)
  );

  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { full_name, email, phone, address, notes, preferred_date } = body;

  if (!full_name || !email || !phone || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = adminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      full_name,
      email,
      phone,
      address,
      notes: notes ?? null,
      preferred_date: preferred_date ?? null,
      appliances: [],
      source: "direct",
      status: "pending",
      installation: false,
      removal: false,
      elevator: false,
      stair_carry: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[customers/post] insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ id: booking.id });
}
