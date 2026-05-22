import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  header: { marginBottom: 32, borderBottomWidth: 1, borderBottomColor: "#D9D9D9", paddingBottom: 20 },
  brand: { fontSize: 18, fontWeight: "bold", letterSpacing: 2, color: "#111111" },
  sub: { fontSize: 9, color: "#7A7A7A", marginTop: 4, letterSpacing: 1 },
  accent: { height: 2, backgroundColor: "#E8A33D", marginTop: 6, width: 60 },
  section: { marginBottom: 20 },
  label: { fontSize: 7, fontWeight: "bold", color: "#7A7A7A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 13, color: "#111111" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#EDEDED", marginVertical: 12 },
  total: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: "bold", color: "#111111" },
  totalValue: { fontSize: 16, fontWeight: "bold", color: "#111111" },
  paid: { backgroundColor: "#1E7E4A", color: "#FFFFFF", fontSize: 10, fontWeight: "bold", padding: "4 12", borderRadius: 4, letterSpacing: 1 },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#B8B8B8", borderTopWidth: 1, borderTopColor: "#EDEDED", paddingTop: 10 },
  sigSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#EDEDED", paddingTop: 16 },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("fp_invoices")
    .select("*, bookings(*), fp_quotes(*)")
    .eq("public_token", token)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = invoice.bookings as Record<string, unknown> | null;
  const quote = invoice.fp_quotes as Record<string, unknown> | null;
  const lineItems: { description: string; amount: string }[] = (quote?.line_items as { description: string; amount: string }[]) ?? [];
  const signatureUrl: string | null = (booking?.signature_url as string) ?? null;

  const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString("en-CA") : null;

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.brand }, "7 SUNS DELIVERY & LOGISTICS"),
        React.createElement(Text, { style: styles.sub }, "PROFESSIONAL DELIVERY & INSTALLATION"),
        React.createElement(View, { style: styles.accent }),
      ),
      // Invoice title + status
      React.createElement(View, { style: { ...styles.section, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" } },
        React.createElement(View, null,
          React.createElement(Text, { style: { fontSize: 22, fontWeight: "bold", color: "#111111", marginBottom: 4 } }, "Invoice"),
          React.createElement(Text, { style: { fontSize: 10, color: "#7A7A7A" } }, `Date: ${invoiceDate}`),
        ),
        invoice.status === "paid" && React.createElement(
          View,
          { style: { backgroundColor: "#1E7E4A", padding: "6 14", borderRadius: 4 } },
          React.createElement(Text, { style: { fontSize: 11, fontWeight: "bold", color: "#FFFFFF", letterSpacing: 1 } }, "PAID"),
        ),
      ),
      // Customer
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Bill To"),
        React.createElement(Text, { style: styles.value }, "7 Suns Delivery and Logistics"),
      ),
      // Line items
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Services"),
        React.createElement(View, { style: styles.divider }),
        ...lineItems.map((li, i) =>
          React.createElement(View, { key: i, style: styles.row },
            React.createElement(Text, { style: { fontSize: 12, color: "#3A3A3A", flex: 1 } }, li.description || "—"),
            React.createElement(Text, { style: { fontSize: 12, color: "#111111" } }, fmt(parseFloat(li.amount) || 0)),
          )
        ),
        React.createElement(View, { style: styles.divider }),
        React.createElement(View, { style: styles.total },
          React.createElement(Text, { style: styles.totalLabel }, "Total"),
          React.createElement(Text, { style: styles.totalValue }, fmt(invoice.amount)),
        ),
        paidDate && React.createElement(Text, { style: { fontSize: 10, color: "#1E7E4A", marginTop: 6 } }, `Payment received: ${paidDate}`),
      ),
      // Signature
      signatureUrl && React.createElement(View, { style: styles.sigSection },
        React.createElement(Text, { style: styles.label }, "Customer Signature"),
        React.createElement(Image, { src: signatureUrl, style: { width: 180, height: 80, objectFit: "contain" } }),
      ),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, "© 7 Suns Delivery & Logistics · Professional delivery and installation services."),
      ),
    )
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${token}.pdf"`,
    },
  });
}
