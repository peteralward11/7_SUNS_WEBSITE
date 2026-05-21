import { createClient } from "@/lib/supabase/server";
import { PortalSidebar, MetricCard, PortalFooter } from "./_components/PortalShell";
import JobsTable from "./_components/JobsTable";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user?.email ?? "")
    .single();

  const isAdmin = portalUser?.is_admin ?? false;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, full_name, address, preferred_date, appliances, status, created_at, project_type, fp_order_number, email")
    .eq("source", "fisher_paykel")
    .order("created_at", { ascending: false });

  const jobs = bookings ?? [];

  const total = jobs.length;
  const active = jobs.filter(j => !["completed", "paid"].includes(j.status ?? "pending")).length;
  const completed = jobs.filter(j => ["completed", "paid"].includes(j.status ?? "")).length;
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F2" }}>
      <PortalSidebar isAdmin={isAdmin} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Page header */}
        <div style={{ padding: "32px 40px 0", backgroundColor: "#F5F5F2" }}>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 6px" }}>
            Fisher &amp; Paykel
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: "0 0 28px", lineHeight: 1.2 }}>
            Delivery Jobs
          </h1>

          {/* Metrics */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            <MetricCard label="Total Jobs" value={total} />
            <MetricCard label="Active" value={active} accentColor="#1F6FEB" />
            <MetricCard label="Completed" value={completed} accentColor="#1E7E4A" />
            <MetricCard label="This Month" value={thisMonth} />
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: "0 40px 40px", flex: 1 }}>
          <JobsTable jobs={jobs} isAdmin={isAdmin} adminHref={isAdmin ? "/partners/admin" : "/partners"} />
        </div>

        <PortalFooter />
      </div>
    </div>
  );
}
