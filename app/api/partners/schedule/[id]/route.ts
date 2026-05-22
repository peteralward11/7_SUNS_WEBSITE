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

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  return portalUser?.is_admin ? user : null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = adminClient();

  // Get the assignment to find the booking_id
  const { data: assignment } = await admin
    .from("fp_job_assignments")
    .select("booking_id")
    .eq("id", id)
    .single();

  const { error } = await admin.from("fp_job_assignments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  // If no remaining assignments for this booking, revert status to "confirmed"
  if (assignment?.booking_id) {
    const { count } = await admin
      .from("fp_job_assignments")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", assignment.booking_id);

    if ((count ?? 0) === 0) {
      await admin
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", assignment.booking_id)
        .eq("status", "scheduled");
    }
  }

  return NextResponse.json({ success: true });
}
