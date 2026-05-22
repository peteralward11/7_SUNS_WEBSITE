import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { PortalFooter } from "../_components/PortalShell";
import PortalPageShell from "../_components/PortalPageShell";
import ScheduleCalendar from "../_components/ScheduleCalendar";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partners/login");

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) redirect("/partners");

  const admin = adminClient();

  const today = new Date().toISOString().split("T")[0];

  const [teamRes, unscheduledRes, miniJobsRes] = await Promise.all([
    admin.from("fp_team_members").select("*").order("name"),
    admin
      .from("bookings")
      .select("id, full_name, address, appliances, status, fp_order_number, email, phone, preferred_date")
      .in("source", ["fisher_paykel", "direct"])
      .in("status", ["confirmed", "quoted"])
      .order("preferred_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("bookings")
      .select("id, created_at")
      .in("source", ["fisher_paykel", "direct"]),
  ]);

  const miniJobs = (miniJobsRes.data ?? []).map(j => ({ id: j.id, created_at: j.created_at }));

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user.email ?? ""} userName={portalUser.name} isAdmin>
      <div className="fp-page-header" style={{ padding: "36px 40px 24px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          Admin
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
          Schedule
        </h1>
      </div>

      <div className="fp-page-content" style={{ padding: "0 40px 40px" }}>
        <ScheduleCalendar
          initialTeam={teamRes.data ?? []}
          initialUnscheduled={unscheduledRes.data ?? []}
          today={today}
        />
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
