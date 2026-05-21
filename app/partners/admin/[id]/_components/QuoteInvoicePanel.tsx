"use client";
import { useState } from "react";

type LineItem = { description: string; amount: string };

type Quote = {
  id: string;
  line_items: LineItem[];
  total: number;
  status: string;
  sent_at?: string | null;
} | null;

type Invoice = {
  id: string;
  amount: number;
  status: string;
  stripe_checkout_url?: string | null;
  public_token: string;
  paid_at?: string | null;
} | null;

const PANEL_STYLE: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #D9D9D9",
  padding: 0,
  position: "sticky",
  top: 24,
};

const SECTION_HEADER: React.CSSProperties = {
  padding: "14px 24px",
  borderBottom: "1px solid #EDEDED",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-block",
  padding: "0 24px",
  height: 38,
  backgroundColor: "#111111",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  border: "none",
  cursor: "pointer",
  width: "100%",
};

const BTN_SECONDARY: React.CSSProperties = {
  display: "inline-block",
  padding: "0 24px",
  height: 38,
  backgroundColor: "transparent",
  color: "#111111",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  border: "1px solid #111111",
  cursor: "pointer",
  width: "100%",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export default function QuoteInvoicePanel({
  bookingId,
  customerEmail,
  customerName,
  quote: initialQuote,
  invoice: initialInvoice,
  invoiceUrl: initialInvoiceUrl,
}: {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  quote: Quote;
  invoice: Invoice;
  invoiceUrl: string | null;
}) {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(initialInvoiceUrl);

  /* Quote builder state */
  const [showBuilder, setShowBuilder] = useState(!initialQuote);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialQuote?.line_items ?? [{ description: "", amount: "" }]
  );
  const [savingQuote, setSavingQuote] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = lineItems.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);

  function addLine() {
    setLineItems([...lineItems, { description: "", amount: "" }]);
  }

  function removeLine(i: number) {
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof LineItem, val: string) {
    const updated = [...lineItems];
    updated[i] = { ...updated[i], [field]: val };
    setLineItems(updated);
  }

  async function saveQuote() {
    setSavingQuote(true);
    const res = await fetch("/api/partners/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, line_items: lineItems, total }),
    });
    const data = await res.json();
    if (data.quote) {
      setQuote(data.quote);
      setShowBuilder(false);
    }
    setSavingQuote(false);
  }

  async function createInvoice() {
    if (!quote) return;
    setSavingInvoice(true);
    const res = await fetch("/api/partners/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: bookingId,
        quote_id: quote.id,
        amount: quote.total,
        customer_email: customerEmail,
        customer_name: customerName,
      }),
    });
    const data = await res.json();
    if (data.invoice) {
      setInvoice(data.invoice);
      setInvoiceUrl(data.invoiceUrl ?? null);
    }
    setSavingInvoice(false);
  }

  function copyLink() {
    if (invoiceUrl) {
      navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Quote card */}
      <div style={PANEL_STYLE}>
        <div style={SECTION_HEADER}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", margin: 0 }}>Quote</h2>
          {quote && !showBuilder && (
            <button
              onClick={() => setShowBuilder(true)}
              style={{ fontSize: "11px", color: "#5A5A5A", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Edit
            </button>
          )}
        </div>

        <div style={{ padding: 24 }}>
          {showBuilder || !quote ? (
            <>
              {/* Line items */}
              <div style={{ marginBottom: 16 }}>
                {lineItems.map((li, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 24px", gap: 8, marginBottom: 8 }}>
                    <input
                      placeholder="Description"
                      value={li.description}
                      onChange={e => updateLine(i, "description", e.target.value)}
                      style={{ padding: "6px 10px", fontSize: "14px", border: "1px solid #D9D9D9", color: "#111111", outline: "none" }}
                    />
                    <input
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                      value={li.amount}
                      onChange={e => updateLine(i, "amount", e.target.value)}
                      style={{ padding: "6px 10px", fontSize: "14px", border: "1px solid #D9D9D9", color: "#111111", outline: "none", fontVariantNumeric: "tabular-nums" }}
                    />
                    <button
                      onClick={() => removeLine(i)}
                      disabled={lineItems.length === 1}
                      style={{ fontSize: "16px", color: "#B44A2C", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button onClick={addLine} style={{ fontSize: "13px", color: "#5A5A5A", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>
                  + Add line
                </button>
              </div>

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #EDEDED", paddingTop: 12, marginBottom: 20 }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}>Total</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111", fontVariantNumeric: "tabular-nums" }}>{fmt(total)}</span>
              </div>

              <button
                onClick={saveQuote}
                disabled={savingQuote || total === 0}
                style={{ ...BTN_PRIMARY, opacity: savingQuote || total === 0 ? 0.5 : 1 }}
              >
                {savingQuote ? "Saving…" : "Save Quote"}
              </button>
            </>
          ) : (
            <>
              {/* Saved quote summary */}
              <div style={{ marginBottom: 16 }}>
                {(quote.line_items as LineItem[]).map((li, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "14px", color: "#3A3A3A" }}>{li.description || "—"}</span>
                    <span style={{ fontSize: "14px", color: "#3A3A3A", fontVariantNumeric: "tabular-nums" }}>{fmt(parseFloat(li.amount) || 0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #EDEDED", paddingTop: 12 }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}>Total</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111", fontVariantNumeric: "tabular-nums" }}>{fmt(quote.total)}</span>
              </div>
              <div style={{ fontSize: "8.5pt", color: "#7A7A7A", marginTop: 8 }}>
                Status: <span style={{ textTransform: "capitalize" }}>{quote.status}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invoice card */}
      {quote && !showBuilder && (
        <div style={PANEL_STYLE}>
          <div style={SECTION_HEADER}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", margin: 0 }}>Invoice</h2>
            {invoice && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "11px",
                color: invoice.status === "paid" ? "#1E7E4A" : "#3F4A5C",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: invoice.status === "paid" ? "#1E7E4A" : "#3F4A5C" }} />
                {invoice.status}
              </span>
            )}
          </div>

          <div style={{ padding: 24 }}>
            {!invoice ? (
              <>
                <p style={{ fontSize: "14px", color: "#5A5A5A", margin: "0 0 20px", lineHeight: 1.5 }}>
                  Create an invoice for {fmt(quote.total)} and generate a payment link to send to the customer.
                </p>
                <button
                  onClick={createInvoice}
                  disabled={savingInvoice}
                  style={{ ...BTN_PRIMARY, opacity: savingInvoice ? 0.5 : 1 }}
                >
                  {savingInvoice ? "Creating…" : "Create Invoice"}
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#111111", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                    {fmt(invoice.amount)}
                  </div>
                  {invoice.paid_at && (
                    <div style={{ fontSize: "13px", color: "#1E7E4A", marginTop: 6 }}>
                      Paid {new Date(invoice.paid_at).toLocaleDateString("en-CA")}
                    </div>
                  )}
                </div>

                {invoiceUrl && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", color: "#5A5A5A", textTransform: "uppercase", marginBottom: 8 }}>
                      Payment Link
                    </div>
                    <div style={{
                      backgroundColor: "#F5F5F2",
                      border: "1px solid #EDEDED",
                      padding: "8px 12px",
                      fontSize: "11px",
                      color: "#3A3A3A",
                      wordBreak: "break-all",
                      marginBottom: 12,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {invoiceUrl}
                    </div>
                    <button onClick={copyLink} style={BTN_SECONDARY}>
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
