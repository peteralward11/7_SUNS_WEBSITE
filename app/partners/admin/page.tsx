import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalFooter } from "../_components/PortalShell";
import PortalPageShell from "../_components/PortalPageShell";
import JobsBarChart from "../_components/JobsBarChart";
import RecentActivityFeed from "../_components/RecentActivityFeed";
import MonthPicker from "../_components/MonthPicker";

export const dynamic = "force-dynamic";

function getBarChartData(
  jobs: { created_at: string; status?: string | null }[],
  refYear: number,
  refMonth: number, // 0-indexed
) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(refYear, refMonth - (5 - i), 1);
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

function StatCard({ label, value, accentColor }: { label: string; value: number; accentColor?: string }) {
  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid var(--border)",
      borderRadius: 10,
      padding: "22px 24px",
      flex: "1 1 160px",
      minWidth: 0,
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
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
      .neq("status", "contact")
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

  // Parse selected month from URL, default to current month
  const params = await searchParams;
  const now = new Date();
  let selYear = now.getFullYear();
  let selMonth = now.getMonth(); // 0-indexed

  const monthParam = params.month;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      selYear = y;
      selMonth = m - 1;
    }
  }

  const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`;

  // Stats filtered to selected month
  const monthJobs = jobs.filter(j => {
    const d = new Date(j.created_at);
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  });

  const newJobs    = monthJobs.length;
  const pending    = monthJobs.filter(j => (j.status ?? "pending") === "pending").length;
  const inProgress = monthJobs.filter(j => ["quoted", "confirmed", "scheduled", "in progress"].includes(j.status ?? "")).length;
  const completed  = monthJobs.filter(j => ["completed", "paid"].includes(j.status ?? "")).length;
  const paid       = monthJobs.filter(j => j.status === "paid").length;

  const chartData = getBarChartData(jobs, selYear, selMonth);
  const miniJobs  = jobs.map(j => ({ id: j.id, created_at: j.created_at }));

  const activityEntries = (recentActivity as unknown as {
    id: string; user_name: string | null; type: string; content: string;
    created_at: string; bookings: { full_name: string } | null;
  }[]);

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user?.email ?? ""} userName={portalUser?.name} isAdmin>
      <div className="fp-page-header fp-page-content" style={{ padding: "36px 40px 40px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          Admin
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px", lineHeight: 1.2 }}>
          Dashboard
        </h1>
        <div style={{ marginBottom: 28 }}>
          <MonthPicker value={monthStr} />
        </div>

        {/* Stat cards — scoped to selected month */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <StatCard label="New Jobs"    value={newJobs} />
          <StatCard label="Pending"     value={pending}    accentColor="#3F4A5C" />
          <StatCard label="In Progress" value={inProgress} accentColor="#1F6FEB" />
          <StatCard label="Completed"   value={completed}  accentColor="#1E7E4A" />
          <StatCard label="Paid"        value={paid}       accentColor="#1E7E4A" />
        </div>

        {/* Bar chart — 6 months ending at selected month */}
        <div style={{ marginBottom: 20 }}>
          <JobsBarChart data={chartData} />
        </div>

        {/* Recent activity */}
        <RecentActivityFeed entries={activityEntries} />
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
