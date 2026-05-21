import { createClient } from "@/lib/supabase/server";
import { MetricCard, PortalFooter } from "./_components/PortalShell";
import JobsTable from "./_components/JobsTable";
import PortalPageShell from "./_components/PortalPageShell";
import JobsBarChart from "./_components/JobsBarChart";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function getBarChartData(jobs: { created_at: string; status?: string | null }[]) {
  const months: { label: string; completed: number; active: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-CA", { month: "short" });
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthJobs = jobs.filter(j => {
      const jd = new Date(j.created_at);
      return jd.getMonth() === month && jd.getFullYear() === year;
    });
    months.push({
      label,
      completed: monthJobs.filter(j => ["completed", "paid"].includes(j.status ?? "")).length,
      active: monthJobs.filter(j => !["completed", "paid"].includes(j.status ?? "")).length,
    });
  }
  return months;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function PartnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user?.email ?? "")
    .single();

  const isAdmin = portalUser?.is_admin ?? false;
  const firstName = portalUser?.name?.split(" ")[0] ?? null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, full_name, email, address, preferred_date, appliances, status, created_at, project_type, fp_order_number")
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

  const chartData = getBarChartData(jobs);
  const miniJobs = jobs.map(j => ({ id: j.id, created_at: j.created_at }));

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user?.email ?? ""} userName={portalUser?.name} isAdmin={isAdmin}>
      <div style={{ padding: "32px 40px 0", backgroundColor: "var(--bg)" }}>
        {/* Greeting */}
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 4px" }}>
          Fisher &amp; Paykel
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: "0 0 28px", lineHeight: 1.2 }}>
          {firstName ? `${getGreeting()}, ${firstName}.` : "Delivery Jobs"}
        </h1>

        {/* Metrics + chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 260px", gap: 12, marginBottom: 32, alignItems: "stretch" }} className="fp-main-grid">
          <MetricCard label="Total Jobs" value={total} />
          <MetricCard label="Active" value={active} accentColor="#1F6FEB" />
          <MetricCard label="Completed" value={completed} accentColor="#1E7E4A" />
          <MetricCard label="This Month" value={thisMonth} />
          <JobsBarChart data={chartData} />
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "0 40px 40px", flex: 1 }}>
        <Suspense>
          <JobsTable jobs={jobs} isAdmin={isAdmin} />
        </Suspense>
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
