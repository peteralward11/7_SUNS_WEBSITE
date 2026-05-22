import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PortalFooter, StatusBadge } from "../../_components/PortalShell";
import PortalPageShell from "../../_components/PortalPageShell";

export const dynamic = "force-dynamic";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function getAppliances(appliances: unknown) {
  if (Array.isArray(appliances)) return (appliances as string[]).join(", ");
  return String(appliances ?? "—");
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = decodeURIComponent(id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partners/login");

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) redirect("/partners");

  const [{ data: allBookings }, { data: paidInvoices }] = await Promise.all([
    adminClient()
      .from("bookings")
      .select("id, full_name, email, phone, address, preferred_date, appliances, status, created_at, fp_order_number, archived")
      .in("source", ["fisher_paykel", "direct"])
      .ilike("email", email)
      .order("created_at", { ascending: false }),
    adminClient()
      .from("fp_invoices")
      .select("booking_id, amount")
      .eq("status", "paid"),
  ]);

  if (!allBookings || allBookings.length === 0) notFound();

  const jobs = allBookings.filter(j => j.status !== "contact");
  const latest = allBookings[0];
  const bookingIds = new Set(allBookings.map(j => j.id));
  const ltv = (paidInvoices ?? [])
    .filter(inv => bookingIds.has(inv.booking_id))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  const miniJobs = jobs.map(j => ({ id: j.id, created_at: j.created_at }));

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user.email ?? ""} userName={portalUser.name} isAdmin={true}>
      <div style={{ padding: "36px 40px 40px", maxWidth: 800 }}>
        {/* Back */}
        <Link href="/partners/customers" style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
          ← All Customers
        </Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            backgroundColor: "var(--hover)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", fontWeight: 700, color: "#E8A33D", flexShrink: 0,
          }}>
            {latest.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{latest.full_name}</h1>
            <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>{email}</p>
            {latest.phone && <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "2px 0 0" }}>{latest.phone}</p>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{jobs.length}</p>
            <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Jobs</p>
          </div>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{jobs.filter(j => j.status === "paid").length}</p>
            <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Paid Jobs</p>
          </div>
          <div style={{ backgroundColor: ltv > 0 ? "rgba(30,126,74,0.06)" : "var(--surface)", border: `1px solid ${ltv > 0 ? "rgba(30,126,74,0.2)" : "var(--border)"}`, borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: "26px", fontWeight: 700, color: ltv > 0 ? "#1E7E4A" : "var(--text)", margin: 0 }}>
              {ltv > 0 ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(ltv) : "—"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Lifetime Value</p>
          </div>
        </div>

        {/* Job history */}
        <div>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px", paddingBottom: 8, borderBottom: "1px solid var(--hairline)" }}>
            Job History
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.length === 0 && (
              <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>No jobs yet.</p>
            )}
            {jobs.map(job => (
              <Link
                key={job.id}
                href={`/partners?job=${job.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  padding: "14px 16px",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  opacity: job.archived ? 0.6 : 1,
                  transition: "border-color 150ms ease",
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                        {job.fp_order_number ? `Order #${job.fp_order_number}` : "—"}
                      </span>
                      {job.archived && (
                        <span style={{ fontSize: "10px", color: "var(--text-3)", backgroundColor: "var(--border)", borderRadius: 4, padding: "2px 7px" }}>Archived</span>
                      )}
                    </div>
                    <StatusBadge status={job.status ?? "pending"} />
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 2px" }}>{getAppliances(job.appliances)}</p>
                  {job.address && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "0 0 2px" }}>{job.address}</p>}
                  <p style={{ fontSize: "11px", color: "var(--text-3)", margin: 0 }}>{fmt(job.preferred_date ?? job.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
