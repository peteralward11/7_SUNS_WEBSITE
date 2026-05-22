import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalFooter } from "../_components/PortalShell";
import PortalPageShell from "../_components/PortalPageShell";
import JobsBarChart from "../_components/JobsBarChart";
import RecentActivityFeed from "../_components/RecentActivityFeed";

export const dynamic = "force-dynamic";

function getBarChartData(jobs: { created_at: string; status?: string | null }[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthJobs = jobs.filter(j => {
      const jd = new Date(j.created_at);
      return jd.getMonth() === month && jd.getFullYear() === year;
    });
    return {
      label: d.toLocaleDateString("en-CA", { month: "short" }),
      completed: monthJobs.filter(j => ["completed", "paid"].includes(j.status ?? "")).length,
      active: monthJobs.filter(j => !["completed", "paid"].includes(j.status ?? "")).length,
    };
  });
}

function PrimaryCard({ label, value, accentColor }: { label: string; value: number; accentColor?: string }) {
  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid var(--border)",
      borderRadius: 8,
      padding: "28px 28px",
      flex: "1 1 0",
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px" }}>
        {label}
      </p>
      <p style={{ fontSize: "42px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  );
}

function SecondaryCard({ label, value, accentColor }: { label: string; value: number; accentColor?: string }) {
  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid var(--border)",
      borderRadius: 8,
      padding: "16px 20px",
      flex: "1 1 0",
    }}>
      <p style={{ fontSize: "7pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 8px" }}>
        {label}
      </p>
      <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [portalUserRes, bookingsRes, activityRes] = await Promise.all([
    supabase
      .from("fp_portal_users")
      .select("is_admin, name")
      .eq("email", user?.email ?? "")
      .single(),
    supabase
      .from("bookings")
      .select("id, created_at, status")
      .in("source", ["fisher_paykel", "direct"])
      .order("created_at", { ascending: false }),
    supabase
      .from("fp_job_activity")
      .select("id, user_name, type, content, created_at, bookings(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const portalUser = portalUserRes.data;
  if (!portalUser?.is_admin) redirect("/partners");

  const jobs = bookingsRes.data ?? [];
  const recentActivity = activityRes.data ?? [];

  const total      = jobs.length;
  const pending    = jobs.filter(j => (j.status ?? "pending") === "pending").length;
  const inProgress = jobs.filter(j => ["quoted", "confirmed", "scheduled", "in progress"].includes(j.status ?? "")).length;
  const completed  = jobs.filter(j => ["completed", "paid"].includes(j.status ?? "")).length;
  const paid       = jobs.filter(j => j.status === "paid").length;
  const thisMonth  = jobs.filter(j => {
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const chartData = getBarChartData(jobs);
  const miniJobs  = jobs.map(j => ({ id: j.id, created_at: j.created_at }));

  // Type-cast for RecentActivityFeed
  const activityEntries = (recentActivity as unknown as {
    id: string; user_name: string | null; type: string; content: string;
    created_at: string; bookings: { full_name: string } | null;
  }[]);

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user?.email ?? ""} userName={portalUser?.name} isAdmin>
      <div style={{ padding: "36px 40px 32px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          Admin
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: "0 0 32px", lineHeight: 1.2 }}>
          Dashboard
        </h1>

        {/* Row 1 — 3 primary KPI cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <PrimaryCard label="Total Jobs" value={total} />
          <PrimaryCard label="Pending" value={pending} accentColor="#3F4A5C" />
          <PrimaryCard label="In Progress" value={inProgress} accentColor="#1F6FEB" />
        </div>

        {/* Row 2 — 3 secondary cards + bar chart */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "stretch" }}>
          <SecondaryCard label="Completed" value={completed} accentColor="#1E7E4A" />
          <SecondaryCard label="Paid" value={paid} accentColor="#1E7E4A" />
          <SecondaryCard label="This Month" value={thisMonth} />
          <div style={{ flex: 2 }}>
            <JobsBarChart data={chartData} />
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivityFeed entries={activityEntries} />
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
