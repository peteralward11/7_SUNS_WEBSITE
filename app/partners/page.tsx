import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PortalHeader, PortalFooter, MetricCard, StatusBadge } from "./_components/PortalShell";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  /* Check admin status */
  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user?.email ?? "")
    .single();

  const isAdmin = portalUser?.is_admin ?? false;

  /* Load F&P bookings */
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, full_name, address, preferred_date, appliances, status, created_at, project_type")
    .eq("source", "fisher_paykel")
    .order("created_at", { ascending: false });

  const jobs = bookings ?? [];

  /* Metrics */
  const total = jobs.length;
  const active = jobs.filter(j => !["completed", "paid"].includes(j.status ?? "pending")).length;
  const completed = jobs.filter(j => ["completed", "paid"].includes(j.status ?? "")).length;
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F5F5F2" }}>
      <PortalHeader isAdmin={isAdmin} />

      <main style={{ flex: 1, padding: "40px" }}>
        {/* Metrics row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          <MetricCard label="Total Jobs" value={total} />
          <MetricCard label="Active" value={active} />
          <MetricCard label="Completed" value={completed} />
          <MetricCard label="This Month" value={thisMonth} />
        </div>

        {/* Table */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #EDEDED" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111111", margin: 0 }}>Delivery Jobs</h2>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", color: "#7A7A7A", margin: 0 }}>
                No jobs scheduled. Your next delivery will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #B8B8B8" }}>
                    {["Customer", "Address", "Appliances", "Preferred Date", "Type", "Status"].map(h => (
                      <th key={h} style={{
                        padding: "10px 24px",
                        textAlign: "left",
                        fontSize: "7.5pt",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "#5A5A5A",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => (
                    <tr
                      key={job.id}
                      style={{
                        borderBottom: i < jobs.length - 1 ? "1px solid #EDEDED" : "none",
                        cursor: "pointer",
                        transition: "background-color 200ms ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#EDEDED")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
                    >
                      <td style={{ padding: "14px 24px" }}>
                        <Link href={`/partners/${job.id}`} style={{ textDecoration: "none", color: "#111111", fontSize: "16px", fontWeight: 500 }}>
                          {job.full_name}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "16px", color: "#3A3A3A", maxWidth: 200 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.address}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "16px", color: "#3A3A3A" }}>
                        {Array.isArray(job.appliances) ? job.appliances.join(", ") : job.appliances ?? "—"}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "16px", color: "#3A3A3A", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {job.preferred_date ?? "—"}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "16px", color: "#3A3A3A", textTransform: "capitalize" }}>
                        {job.project_type ?? "residential"}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <StatusBadge status={job.status ?? "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
