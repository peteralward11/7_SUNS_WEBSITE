import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  header: { marginBottom: 32, borderBottomWidth: 1, borderBottomColor: "#D9D9D9", paddingBottom: 20 },
  brand: { fontSize: 18, fontWeight: "bold", letterSpacing: 2, color: "#111111" },
  sub: { fontSize: 9, color: "#7A7A7A", marginTop: 4, letterSpacing: 1 },
  section: { marginBottom: 20 },
  label: { fontSize: 7, fontWeight: "bold", color: "#7A7A7A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 13, color: "#111111" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#EDEDED", marginVertical: 12 },
  total: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: "bold", color: "#111111" },
  totalValue: { fontSize: 13, fontWeight: "bold", color: "#111111" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#B8B8B8", borderTopWidth: 1, borderTopColor: "#EDEDED", paddingTop: 10 },
  accent: { height: 2, backgroundColor: "#E8A33D", marginTop: 6, width: 60 },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [quoteRes, bookingRes] = await Promise.all([
    supabase.from("fp_quotes").select("*").eq("id", id).single(),
    supabase.from("bookings").select("full_name, email, address, fp_order_number").eq("source", "fisher_paykel").single(),
  ]);

  if (!quoteRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const quote = quoteRes.data;
  const booking = bookingRes.data;

  const lineItems: { description: string; amount: string }[] = quote.line_items ?? [];
  const createdDate = new Date(quote.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.brand }, "FISHER & PAYKEL"),
        React.createElement(Text, { style: styles.sub }, "DELIVERED BY 7SUNS · AUTHORISED PARTNER"),
        React.createElement(View, { style: styles.accent }),
      ),
      // Quote title
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: { fontSize: 22, fontWeight: "bold", color: "#111111", marginBottom: 4 } }, "Quote"),
        React.createElement(Text, { style: { fontSize: 10, color: "#7A7A7A" } }, `Date: ${createdDate}`),
        booking?.fp_order_number && React.createElement(Text, { style: { fontSize: 10, color: "#7A7A7A", marginTop: 2 } }, `Order #${booking.fp_order_number}`),
      ),
      // Customer
      booking && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Bill To"),
        React.createElement(Text, { style: styles.value }, booking.full_name),
        booking.email && React.createElement(Text, { style: { fontSize: 11, color: "#5A5A5A" } }, booking.email),
        booking.address && React.createElement(Text, { style: { fontSize: 11, color: "#5A5A5A" } }, booking.address),
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
          React.createElement(Text, { style: styles.totalValue }, fmt(quote.total)),
        ),
      ),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, "© Fisher & Paykel Appliances Ltd · Delivered by 7Suns, an authorised Fisher & Paykel partner. Engineered for Life."),
      ),
    )
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quote-${id}.pdf"`,
    },
  });
}
