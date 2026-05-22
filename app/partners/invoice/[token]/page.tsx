import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type LineItem = { description: string; amount: string };

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  unpaid: "#3F4A5C",
  paid: "#1E7E4A",
};

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("fp_invoices")
    .select("*, fp_quotes(line_items, total), bookings(full_name, address, preferred_date, fp_order_number, appliances)")
    .eq("public_token", token)
    .single();

  if (!invoice) notFound();

  const booking = invoice.bookings as {
    full_name: string;
    address: string;
    preferred_date: string;
    fp_order_number?: string;
    appliances?: string[] | string;
  };
  const quote = invoice.fp_quotes as { line_items: LineItem[]; total: number };
  const lineItems: LineItem[] = quote?.line_items ?? [];
  const total = invoice.amount;
  const isPaid = invoice.status === "paid";
  const statusColor = STATUS_COLORS[invoice.status] ?? "#7A7A7A";

  const appliances = Array.isArray(booking?.appliances)
    ? booking.appliances.join(", ")
    : booking?.appliances ?? "—";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F2", display: "flex", flexDirection: "column" }}>
      {/* Masthead */}
      <header style={{
        backgroundColor: "#111111",
        borderBottom: "1px solid #3A3A3A",
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ color: "#FFFFFF", fontSize: "12pt", fontWeight: 700, letterSpacing: "0.06em" }}>
            7 SUNS DELIVERY &amp; LOGISTICS
          </div>
          <div style={{ color: "#7A7A7A", fontSize: "8.5pt", letterSpacing: "0.03em", marginTop: 2 }}>
            Professional Delivery &amp; Installation
          </div>
          <div style={{ height: "1.8px", backgroundColor: "#E8A33D", marginTop: 6 }} />
        </div>
      </header>

      <main style={{ flex: 1, padding: "48px 24px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {/* Invoice header */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", marginBottom: 16 }}>
          <div style={{ padding: "28px 32px", borderBottom: "1px solid #EDEDED" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Invoice
                </p>
                <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: "0 0 4px" }}>
                  7 Suns Delivery and Logistics
                </h1>
                <p style={{ fontSize: "14px", color: "#5A5A5A", margin: 0 }}>
                  Fisher &amp; Paykel Order #{booking?.fp_order_number ?? "—"}
                </p>
              </div>
              {/* Status badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderLeft: `3px solid ${statusColor}`,
                backgroundColor: "#F5F5F2",
              }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: statusColor, textTransform: "uppercase" }}>
                  {isPaid ? "Paid in full" : "Payment due"}
                </span>
              </div>
            </div>
          </div>

          {/* Job details */}
          <div style={{ padding: "20px 32px", borderBottom: "1px solid #EDEDED" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <p style={{ fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.04em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 6px" }}>
                  Delivery Address
                </p>
                <p style={{ fontSize: "16px", color: "#3A3A3A", margin: 0 }}>{booking?.address}</p>
              </div>
              <div>
                <p style={{ fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.04em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 6px" }}>
                  Preferred Date
                </p>
                <p style={{ fontSize: "16px", color: "#3A3A3A", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                  {booking?.preferred_date ?? "—"}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.04em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 6px" }}>
                  Appliances
                </p>
                <p style={{ fontSize: "16px", color: "#3A3A3A", margin: 0 }}>{appliances}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div style={{ padding: "24px 32px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #B8B8B8" }}>
                  <th style={{ padding: "0 0 10px", textAlign: "left", fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase" }}>
                    Description
                  </th>
                  <th style={{ padding: "0 0 10px", textAlign: "right", fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase" }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #EDEDED" }}>
                    <td style={{ padding: "14px 0", fontSize: "16px", color: "#3A3A3A" }}>{li.description}</td>
                    <td style={{ padding: "14px 0", fontSize: "16px", color: "#3A3A3A", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(parseFloat(li.amount) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: "16px 0 0", fontSize: "13px", fontWeight: 700, color: "#111111" }}>Total</td>
                  <td style={{ padding: "16px 0 0", fontSize: "13px", fontWeight: 700, color: "#111111", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmt(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment CTA */}
        {!isPaid && invoice.stripe_checkout_url && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", padding: "28px 32px" }}>
            <p style={{ fontSize: "16px", color: "#3A3A3A", margin: "0 0 20px", lineHeight: 1.6 }}>
              A summary of your delivery and installation services. Complete payment below to confirm your booking.
            </p>
            <a
              href={invoice.stripe_checkout_url}
              style={{
                display: "block",
                textAlign: "center",
                padding: "0 24px",
                height: 48,
                lineHeight: "48px",
                backgroundColor: "#111111",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Pay Now — {fmt(total)}
            </a>
          </div>
        )}

        {isPaid && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9", padding: "28px 32px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "#1E7E4A", margin: 0, fontWeight: 500 }}>
              A summary of your installation, paid in full.
            </p>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #EDEDED", padding: "16px 40px", textAlign: "center", backgroundColor: "#FFFFFF" }}>
        <p style={{ fontSize: "8.5pt", color: "#5A5A5A", margin: 0 }}>
          © 7 Suns Delivery &amp; Logistics · Professional delivery and installation services.
        </p>
      </footer>
    </div>
  );
}
