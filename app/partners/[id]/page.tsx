import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortalSidebar, PortalFooter, StatusBadge } from "../_components/PortalShell";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 4px" }}>
        {label}
      </p>
      <p style={{ fontSize: "15px", color: "#111111", margin: 0, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <div>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 4px" }}>
        {label}
      </p>
      <p style={{ fontSize: "15px", color: value ? "#1E7E4A" : "#3A3A3A", margin: 0 }}>{value ? "Yes" : "No"}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", marginBottom: 12 }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #EDEDED", backgroundColor: "#F5F5F2" }}>
        <h2 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5A5A5A", margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
        {children}
      </div>
    </div>
  );
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user?.email ?? "")
    .single();

  const isAdmin = portalUser?.is_admin ?? false;

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("source", "fisher_paykel")
    .single();

  if (!booking) notFound();

  const appliances = Array.isArray(booking.appliances)
    ? booking.appliances.join(", ")
    : booking.appliances ?? "—";

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F2" }}>
      <PortalSidebar isAdmin={isAdmin} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "32px 40px", flex: 1 }}>
          {/* Back */}
          <Link href="/partners" style={{ fontSize: "13px", color: "#5A5A5A", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Back to jobs
          </Link>

          {/* Job header */}
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", padding: "24px 28px", marginBottom: 12, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 6px" }}>
                Fisher &amp; Paykel · Order #{booking.fp_order_number ?? "—"}
              </p>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: "0 0 4px", lineHeight: 1.2 }}>
                {booking.full_name}
              </h1>
              <p style={{ fontSize: "14px", color: "#5A5A5A", margin: 0 }}>
                Submitted {new Date(booking.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <StatusBadge status={booking.status ?? "pending"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 12, alignItems: "start" }}>
            {/* Left */}
            <div>
              <SectionCard title="Customer">
                <Field label="Full Name" value={booking.full_name} />
                <Field label="Email" value={booking.email} />
                <Field label="Phone" value={booking.phone} />
              </SectionCard>

              <SectionCard title="Delivery Address">
                <Field label="Address" value={booking.address} />
                <Field label="Suite / Unit" value={booking.suite_number} />
                <Field label="Floor" value={booking.floor_number} />
              </SectionCard>

              <SectionCard title="Appliances & Services">
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Appliances" value={appliances} />
                </div>
                <BoolField label="Installation" value={booking.installation} />
                <BoolField label="Old Unit Removal" value={booking.removal} />
                <BoolField label="Elevator Required" value={booking.elevator} />
                <BoolField label="Stair Carry" value={booking.stair_carry} />
              </SectionCard>

              <SectionCard title="Scheduling">
                <Field label="Preferred Date" value={booking.preferred_date} />
                <Field label="Alternate Date" value={booking.alternate_date} />
                <Field label="Time Window" value={booking.time_window} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Access Notes" value={booking.access_notes} />
                </div>
              </SectionCard>

              {booking.project_type === "builder" && (
                <SectionCard title="Builder / Commercial">
                  <Field label="Company" value={booking.company_name} />
                  <Field label="Unit Count" value={booking.unit_count ? String(booking.unit_count) : null} />
                  <Field label="Site Contact" value={booking.site_contact_name} />
                  <Field label="Site Phone" value={booking.site_contact_phone} />
                </SectionCard>
              )}

              {booking.notes && (
                <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", padding: "20px 24px" }}>
                  <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 8px" }}>Notes</p>
                  <p style={{ fontSize: "15px", color: "#3A3A3A", margin: 0, lineHeight: 1.6 }}>{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Right — job summary card */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", padding: "24px" }}>
              <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 20px" }}>
                Job Summary
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SummaryRow label="Type" value={booking.project_type === "builder" ? "Builder / Commercial" : "Residential"} />
                <SummaryRow label="Order #" value={booking.fp_order_number ?? "—"} />
                <SummaryRow label="Preferred Date" value={booking.preferred_date ?? "—"} />
                <SummaryRow label="Appliances" value={appliances} />
                <div style={{ borderTop: "1px solid #EDEDED", paddingTop: 14 }}>
                  <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 8px" }}>Status</p>
                  <StatusBadge status={booking.status ?? "pending"} />
                </div>
              </div>

              {isAdmin && (
                <div style={{ marginTop: 24, borderTop: "1px solid #EDEDED", paddingTop: 20 }}>
                  <Link
                    href={`/partners/admin/${booking.id}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "0 24px",
                      height: 38,
                      lineHeight: "38px",
                      backgroundColor: "#111111",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                    }}
                  >
                    Manage in Admin
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <PortalFooter />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: "11px", color: "#7A7A7A", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: "14px", color: "#111111", margin: 0, fontWeight: 500 }}>{value}</p>
    </div>
  );
}
