import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PortalHeader, PortalFooter, StatusBadge } from "../../_components/PortalShell";
import AdminStatusSelect from "../_components/AdminStatusSelect";
import QuoteInvoicePanel from "./_components/QuoteInvoicePanel";

export const dynamic = "force-dynamic";

const ALL_STATUSES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <tr style={{ borderBottom: "1px solid #EDEDED" }}>
      <td style={{ padding: "12px 24px", fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.04em", color: "#5A5A5A", textTransform: "uppercase", whiteSpace: "nowrap", width: 200 }}>
        {label}
      </td>
      <td style={{ padding: "12px 24px", fontSize: "16px", color: "#3A3A3A" }}>{value}</td>
    </tr>
  );
}

function BoolRow({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <tr style={{ borderBottom: "1px solid #EDEDED" }}>
      <td style={{ padding: "12px 24px", fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.04em", color: "#5A5A5A", textTransform: "uppercase", whiteSpace: "nowrap", width: 200 }}>
        {label}
      </td>
      <td style={{ padding: "12px 24px", fontSize: "16px", color: "#3A3A3A" }}>{value ? "Yes" : "No"}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", marginBottom: 16 }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #EDEDED" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user?.email ?? "")
    .single();

  if (!portalUser?.is_admin) redirect("/partners");

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("source", "fisher_paykel")
    .single();

  if (!booking) notFound();

  /* Load associated quote and invoice */
  const { data: quote } = await supabase
    .from("fp_quotes")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: invoice } = await supabase
    .from("fp_invoices")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const appliances = Array.isArray(booking.appliances)
    ? booking.appliances.join(", ")
    : booking.appliances ?? "—";

  const invoiceUrl = invoice?.public_token
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/partners/invoice/${invoice.public_token}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F5F5F2" }}>
      <PortalHeader isAdmin />

      <main style={{ flex: 1, padding: "40px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        {/* Back + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <Link href="/partners/admin" style={{ fontSize: "13px", color: "#5A5A5A", textDecoration: "none" }}>
            ← Back to admin
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: "13px", color: "#5A5A5A" }}>Status:</span>
            <AdminStatusSelect bookingId={booking.id} currentStatus={booking.status ?? "pending"} statuses={ALL_STATUSES} />
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 8px" }}>
            Fisher &amp; Paykel Job
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: 0, lineHeight: 1.2 }}>
            {booking.full_name}
          </h1>
          <p style={{ fontSize: "16px", color: "#5A5A5A", margin: "4px 0 0" }}>
            Order #{booking.fp_order_number ?? "—"} · Submitted {new Date(booking.created_at).toLocaleDateString("en-CA")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* Left column — booking details */}
          <div>
            <Section title="Customer">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="Name" value={booking.full_name} />
                  <Row label="Email" value={booking.email} />
                  <Row label="Phone" value={booking.phone} />
                </tbody>
              </table>
            </Section>

            <Section title="Delivery Address">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="Address" value={booking.address} />
                  <Row label="Suite / Unit" value={booking.suite_number} />
                  <Row label="Floor" value={booking.floor_number} />
                </tbody>
              </table>
            </Section>

            <Section title="Appliances & Services">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="Appliances" value={appliances} />
                  <BoolRow label="Installation" value={booking.installation} />
                  <BoolRow label="Removal" value={booking.removal} />
                  <BoolRow label="Elevator" value={booking.elevator} />
                  <BoolRow label="Stair carry" value={booking.stair_carry} />
                </tbody>
              </table>
            </Section>

            <Section title="Scheduling">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <Row label="Preferred date" value={booking.preferred_date} />
                  <Row label="Alternate date" value={booking.alternate_date} />
                  <Row label="Time window" value={booking.time_window} />
                  <Row label="Access notes" value={booking.access_notes} />
                </tbody>
              </table>
            </Section>

            {booking.project_type === "builder" && (
              <Section title="Builder / Commercial">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <Row label="Company" value={booking.company_name} />
                    <Row label="Site contact" value={booking.site_contact_name} />
                    <Row label="Site phone" value={booking.site_contact_phone} />
                    <Row label="Unit count" value={booking.unit_count ? String(booking.unit_count) : null} />
                  </tbody>
                </table>
              </Section>
            )}

            {booking.notes && (
              <Section title="Notes">
                <p style={{ padding: "12px 24px", fontSize: "16px", color: "#3A3A3A", margin: 0, lineHeight: 1.6 }}>
                  {booking.notes}
                </p>
              </Section>
            )}
          </div>

          {/* Right column — quote & invoice */}
          <QuoteInvoicePanel
            bookingId={booking.id}
            customerEmail={booking.email}
            customerName={booking.full_name}
            quote={quote}
            invoice={invoice}
            invoiceUrl={invoiceUrl}
          />
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
