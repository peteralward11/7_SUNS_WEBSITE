import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { PortalFooter } from "../_components/PortalShell";
import PortalPageShell from "../_components/PortalPageShell";
import MySchedule from "../_components/MySchedule";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function MySchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partners/login");

  const admin = adminClient();
  const today = new Date().toISOString().split("T")[0];

  const [portalUserRes, teamMemberRes, miniJobsRes] = await Promise.all([
    supabase.from("fp_portal_users").select("is_admin, name").eq("email", user.email ?? "").single(),
    admin.from("fp_team_members").select("id, name, color").eq("email", user.email ?? "").maybeSingle(),
    supabase.from("bookings").select("id, created_at").in("source", ["fisher_paykel", "direct"]),
  ]);

  const portalUser = portalUserRes.data;
  if (!portalUser) redirect("/partners/login");

  // Admins don't use this page
  if (portalUser.is_admin) redirect("/partners/schedule");

  const teamMember = teamMemberRes.data;
  const miniJobs = (miniJobsRes.data ?? []).map(j => ({ id: j.id, created_at: j.created_at }));

  let assignments: {
    id: string; scheduled_date: string; time_start: string; time_end: string;
    booking_id: string;
    bookings: { id: string; full_name: string; address: string | null; appliances: unknown; status: string | null; fp_order_number: string | null } | null;
  }[] = [];

  if (teamMember) {
    const { data } = await admin
      .from("fp_job_assignments")
      .select("id, scheduled_date, time_start, time_end, booking_id, bookings(id, full_name, address, appliances, status, fp_order_number)")
      .eq("team_member_id", teamMember.id)
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true });
    assignments = (data ?? []) as unknown as typeof assignments;
  }

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user.email ?? ""} userName={portalUser.name} isAdmin={false}>
      <div className="fp-page-header" style={{ padding: "36px 40px 24px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          {teamMember?.name ?? "Team Member"}
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
          My Schedule
        </h1>
      </div>

      <div className="fp-page-content" style={{ padding: "0 40px 40px" }}>
        <MySchedule assignments={assignments} teamMemberColor={teamMember?.color ?? "#E8A33D"} />
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
