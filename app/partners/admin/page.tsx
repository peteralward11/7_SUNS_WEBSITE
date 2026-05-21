import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalHeader, PortalFooter, StatusBadge } from "../_components/PortalShell";
import AdminStatusSelect from "./_components/AdminStatusSelect";

export const dynamic = "force-dynamic";

const ALL_STATUSES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];

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
    .select("id, full_name, address, preferred_date, appliances, status, created_at, project_type, fp_order_number, phone, email")
    .eq("source", "fisher_paykel")
    .order("created_at", { ascending: false });

  const jobs = bookings ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F5F5F2" }}>
      <PortalHeader isAdmin />

      <main style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 8px" }}>
            Admin Panel
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: 0 }}>All Jobs</h1>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9" }}>
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
                    {["Customer", "Order #", "Address", "Preferred Date", "Status", "Actions"].map(h => (
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
                      style={{ borderBottom: i < jobs.length - 1 ? "1px solid #EDEDED" : "none" }}
                    >
                      <td style={{ padding: "12px 24px" }}>
                        <Link href={`/partners/admin/${job.id}`} style={{ textDecoration: "none", color: "#111111", fontSize: "16px", fontWeight: 500 }}>
                          {job.full_name}
                        </Link>
                        <div style={{ fontSize: "13px", color: "#7A7A7A", marginTop: 2 }}>{job.email}</div>
                      </td>
                      <td style={{ padding: "12px 24px", fontSize: "16px", color: "#3A3A3A", fontVariantNumeric: "tabular-nums" }}>
                        {job.fp_order_number ?? "—"}
                      </td>
                      <td style={{ padding: "12px 24px", fontSize: "16px", color: "#3A3A3A", maxWidth: 180 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.address}
                        </span>
                      </td>
                      <td style={{ padding: "12px 24px", fontSize: "16px", color: "#3A3A3A", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {job.preferred_date ?? "—"}
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <AdminStatusSelect bookingId={job.id} currentStatus={job.status ?? "pending"} statuses={ALL_STATUSES} />
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <Link
                          href={`/partners/admin/${job.id}`}
                          style={{
                            display: "inline-block",
                            padding: "6px 16px",
                            border: "1px solid #111111",
                            color: "#111111",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                          }}
                        >
                          View
                        </Link>
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
