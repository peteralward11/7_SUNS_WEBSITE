import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { PortalFooter } from "../../_components/PortalShell";
import PortalPageShell from "../../_components/PortalPageShell";
import TeamPage from "../../_components/TeamPage";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function TeamManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partners/login");

  const [portalUserRes, teamRes, miniJobsRes] = await Promise.all([
    supabase.from("fp_portal_users").select("is_admin, name").eq("email", user.email ?? "").single(),
    adminClient().from("fp_team_members").select("id, name, role, color, email").order("name"),
    supabase.from("bookings").select("id, created_at").in("source", ["fisher_paykel", "direct"]),
  ]);

  const portalUser = portalUserRes.data;
  if (!portalUser?.is_admin) redirect("/partners");

  const miniJobs = (miniJobsRes.data ?? []).map(j => ({ id: j.id, created_at: j.created_at }));

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user.email ?? ""} userName={portalUser.name} isAdmin>
      <div style={{ padding: "36px 40px 24px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          Admin
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
          Team
        </h1>
      </div>

      <div style={{ padding: "0 40px 40px" }}>
        <TeamPage initialMembers={teamRes.data ?? []} />
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
