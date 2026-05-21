import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalSidebar, MetricCard, PortalFooter } from "../_components/PortalShell";
import JobsTable from "../_components/JobsTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user?.email ?? "")
    .single();

  if (!portalUser?.is_admin) redirect("/partners");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, full_name, address, preferred_date, appliances, status, created_at, project_type, fp_order_number, email, phone")
    .eq("source", "fisher_paykel")
    .order("created_at", { ascending: false });

  const jobs = bookings ?? [];

  const pending = jobs.filter(j => (j.status ?? "pending") === "pending").length;
  const inProgress = jobs.filter(j => ["quoted", "confirmed", "scheduled", "in progress"].includes(j.status ?? "")).length;
  const paid = jobs.filter(j => j.status === "paid").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F2" }}>
      <PortalSidebar isAdmin />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Page header */}
        <div style={{ padding: "32px 40px 0", backgroundColor: "#F5F5F2" }}>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 6px" }}>
            Admin
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: "0 0 28px", lineHeight: 1.2 }}>
            Manage Jobs
          </h1>

          {/* Metrics */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            <MetricCard label="Total" value={jobs.length} />
            <MetricCard label="Pending" value={pending} accentColor="#3F4A5C" />
            <MetricCard label="In Progress" value={inProgress} accentColor="#1F6FEB" />
            <MetricCard label="Paid" value={paid} accentColor="#1E7E4A" />
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: "0 40px 40px", flex: 1 }}>
          <JobsTable jobs={jobs} isAdmin adminHref="/partners/admin" />
        </div>

        <PortalFooter />
      </div>
    </div>
  );
}
