"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { StatusBadge } from "./PortalShell";
import WorkflowSteps from "./WorkflowSteps";
import ActivityLog from "./ActivityLog";
import PhotoGallery from "./PhotoGallery";
import SignatureCapture from "./SignatureCapture";

/* ─── Types ─────────────────────────────────────────────── */
type LineItem = { description: string; amount: string };
interface Photo  { id: string; url: string; uploaded_by: string | null; created_at: string }
interface Quote  { id: string; line_items: LineItem[]; total: number; status: string; sent_at?: string | null }
interface Invoice { id: string; amount: number; status: string; stripe_checkout_url?: string | null; public_token: string; paid_at?: string | null }
interface Booking { [key: string]: unknown }

/* ─── Helpers ─────────────────────────────────────────────── */
function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function DField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: "14px", color: "var(--text)", margin: 0, lineHeight: 1.4 }}>{value}</p>
    </div>
  );
}

function DBool({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: "14px", color: value ? "#1E7E4A" : "var(--text-2)", margin: 0 }}>{value ? "Yes" : "No"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid var(--hairline)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─── Quote/Invoice Panel (inline) ─────────────────────────── */
function QuotePanel({ bookingId, customerEmail, customerName, quote: q0, invoice: i0, invoiceUrl: u0 }: {
  bookingId: string; customerEmail: string; customerName: string;
  quote: Quote | null; invoice: Invoice | null; invoiceUrl: string | null;
}) {
  const [quote, setQuote]       = useState<Quote | null>(q0);
  const [invoice, setInvoice]   = useState<Invoice | null>(i0);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(u0);
  const [showBuilder, setShowBuilder] = useState(!q0);
  const [lineItems, setLineItems] = useState<LineItem[]>(q0?.line_items ?? [{ description: "", amount: "" }]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);

  function updateLine(i: number, f: keyof LineItem, v: string) {
    setLineItems(l => { const n = [...l]; n[i] = { ...n[i], [f]: v }; return n; });
  }

  async function saveQuote() {
    setSaving(true);
    const res = await fetch("/api/partners/quotes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, line_items: lineItems, total }),
    });
    const d = await res.json();
    if (d.quote) { setQuote(d.quote); setShowBuilder(false); }
    setSaving(false);
  }

  async function createInvoice() {
    if (!quote) return;
    setCreating(true);
    const res = await fetch("/api/partners/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, quote_id: quote.id, amount: quote.total, customer_email: customerEmail, customer_name: customerName }),
    });
    const d = await res.json();
    if (d.invoice) { setInvoice(d.invoice); setInvoiceUrl(d.invoiceUrl ?? null); }
    setCreating(false);
  }

  function copyLink() {
    if (!invoiceUrl) return;
    navigator.clipboard.writeText(invoiceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    padding: "7px 10px", fontSize: "13px", border: "1px solid var(--border)",
    borderRadius: 4, backgroundColor: "var(--input-bg)", color: "var(--text)",
    outline: "none", fontFamily: "inherit", width: "100%",
  };
  const btn = (primary: boolean, disabled = false): React.CSSProperties => ({
    padding: "9px 16px", width: "100%", border: primary ? "none" : "1px solid var(--border)",
    borderRadius: 6, fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
    textTransform: "uppercase", cursor: disabled ? "default" : "pointer",
    backgroundColor: primary ? (disabled ? "var(--border)" : "#111111") : "transparent",
    color: primary ? (disabled ? "var(--text-3)" : "#FFFFFF") : "var(--text-2)",
    transition: "background-color 150ms ease",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Quote */}
      <Section title="Quote">
        {showBuilder || !quote ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {lineItems.map((li, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 24px", gap: 6 }}>
                  <input style={inputStyle} placeholder="Description" value={li.description} onChange={e => updateLine(i, "description", e.target.value)} />
                  <input style={{ ...inputStyle, textAlign: "right" }} placeholder="0.00" type="number" min="0" step="0.01" value={li.amount} onChange={e => updateLine(i, "amount", e.target.value)} />
                  <button onClick={() => setLineItems(l => l.filter((_, j) => j !== i))} disabled={lineItems.length === 1} style={{ background: "none", border: "none", color: "#B44A2C", cursor: "pointer", fontSize: "16px", padding: 0 }}>×</button>
                </div>
              ))}
              <button onClick={() => setLineItems(l => [...l, { description: "", amount: "" }])} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "12px", padding: 0 }}>+ Add line</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--hairline)", paddingTop: 10, marginBottom: 14 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Total</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{fmt(total)}</span>
            </div>
            <button onClick={saveQuote} disabled={saving || total === 0} style={btn(true, saving || total === 0)}>
              {saving ? "Saving…" : "Save Quote"}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              {(quote.line_items as LineItem[]).map((li, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{li.description || "—"}</span>
                  <span style={{ fontSize: "13px", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{fmt(parseFloat(li.amount) || 0)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--hairline)", paddingTop: 10, marginBottom: 12 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Total</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{fmt(quote.total)}</span>
            </div>
            <button onClick={() => setShowBuilder(true)} style={{ ...btn(false), width: "auto", padding: "5px 12px", fontSize: "11px" }}>Edit Quote</button>
          </>
        )}
      </Section>

      {/* Invoice */}
      {quote && !showBuilder && (
        <Section title="Invoice">
          {!invoice ? (
            <>
              <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 14px", lineHeight: 1.5 }}>
                Create an invoice for {fmt(quote.total)} and generate a payment link.
              </p>
              <button onClick={createInvoice} disabled={creating} style={btn(true, creating)}>
                {creating ? "Creating…" : "Create Invoice"}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{fmt(invoice.amount)}</span>
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: invoice.status === "paid" ? "#1E7E4A" : "#3F4A5C",
                  backgroundColor: invoice.status === "paid" ? "#1E7E4A22" : "#3F4A5C22",
                  padding: "3px 8px", borderRadius: 99,
                }}>
                  {invoice.status}
                </span>
              </div>
              {invoice.paid_at && (
                <p style={{ fontSize: "12px", color: "#1E7E4A", margin: "0 0 12px" }}>
                  Paid {new Date(invoice.paid_at).toLocaleDateString("en-CA")}
                </p>
              )}
              {invoiceUrl && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ backgroundColor: "var(--hover)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 10px", fontSize: "11px", color: "var(--text-2)", wordBreak: "break-all", marginBottom: 8 }}>
                    {invoiceUrl}
                  </div>
                  <button onClick={copyLink} style={btn(false)}>{copied ? "Copied!" : "Copy Payment Link"}</button>
                </div>
              )}
              {invoiceUrl && (
                <a
                  href={`/api/partners/pdf/invoice/${invoice.public_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...btn(true) as React.CSSProperties, display: "block", textAlign: "center", textDecoration: "none", marginTop: 8 }}
                >
                  Download PDF
                </a>
              )}
            </>
          )}
        </Section>
      )}
    </div>
  );
}

/* ─── Main Drawer ─────────────────────────────────────────── */
interface DrawerProps {
  bookingId: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, status: string) => void;
}

export default function JobDrawer({ bookingId, isAdmin, onClose, onStatusChange }: DrawerProps) {
  const [data, setData] = useState<{ booking: Booking; photos: Photo[]; quote: Quote | null; invoice: Invoice | null; invoiceUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [archived, setArchived] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setData(null);
    const res = await fetch(`/api/partners/jobs/${id}`);
    const d = await res.json();
    setData(d);
    setStatus(String(d.booking?.status ?? "pending"));
    setSignatureUrl(String(d.booking?.signature_url ?? "") || null);
    setArchived(!!d.booking?.archived);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (bookingId) load(bookingId);
  }, [bookingId, load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!bookingId) return null;

  const booking = data?.booking as Record<string, unknown> | undefined;
  const appliances = booking
    ? Array.isArray(booking.appliances)
      ? (booking.appliances as string[]).join(", ")
      : String(booking.appliances ?? "—")
    : "";

  const showSignature = isAdmin && ["in progress", "completed", "paid"].includes(status);
  const showArchiveBtn = isAdmin && status === "paid";

  async function archiveJob() {
    if (!bookingId || archiving) return;
    setArchiving(true);
    const next = !archived;
    setArchived(next);
    await fetch(`/api/partners/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: next }),
    });
    setArchiving(false);
    if (next) onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fp-backdrop"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 80,
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fp-drawer"
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "min(540px, 100vw)",
          backgroundColor: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          backgroundColor: "var(--surface)",
          zIndex: 10,
        }}>
          <div>
            {booking && (
              <>
                <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 4px" }}>
                  Order #{String(booking.fp_order_number ?? "—")}
                </p>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
                  {String(booking.full_name ?? "")}
                </h2>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {booking && <StatusBadge status={status} />}
            {showArchiveBtn && (
              <button
                onClick={archiveJob}
                disabled={archiving}
                title="Archive this job"
                style={{
                  padding: "5px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-3)",
                  cursor: archiving ? "default" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {archiving ? "Archiving…" : archived ? "Unarchive" : "Archive Job"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32,
                borderRadius: 8,
                backgroundColor: "var(--hover)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {loading && (
            <div style={{ animation: "fp-fade-in 150ms ease" }}>
              {[100, 60, 80, 100, 45, 70].map((w, i) => (
                <div key={i} style={{ height: i % 3 === 0 ? 14 : 11, width: `${w}%`, borderRadius: 4, backgroundColor: "var(--border)", marginBottom: i % 3 === 2 ? 24 : 8, opacity: 0.6 + i * 0.05 }} />
              ))}
              <div style={{ height: 1, backgroundColor: "var(--hairline)", margin: "8px 0 24px" }} />
              {[55, 90, 40, 75, 100, 60].map((w, i) => (
                <div key={i} style={{ height: 11, width: `${w}%`, borderRadius: 4, backgroundColor: "var(--border)", marginBottom: i % 2 === 1 ? 20 : 8, opacity: 0.5 }} />
              ))}
            </div>
          )}

          {!loading && data && booking && (
            <>
              {/* Workflow (admin) */}
              {isAdmin && (
                <div style={{ marginBottom: 28 }}>
                  <WorkflowSteps
                    bookingId={String(booking.id)}
                    currentStatus={status}
                    isAdmin={isAdmin}
                    onStatusChange={(s) => {
                      setStatus(s);
                      if (bookingId) onStatusChange?.(bookingId, s);
                    }}
                  />
                </div>
              )}

              {/* Customer */}
              <Section title="Customer">
                <DField label="Name" value={String(booking.full_name ?? "")} />
                <DField label="Email" value={String(booking.email ?? "")} />
                <DField label="Phone" value={String(booking.phone ?? "")} />
              </Section>

              {/* Address */}
              <Section title="Delivery Address">
                <DField label="Address" value={String(booking.address ?? "")} />
                <DField label="Suite / Unit" value={booking.suite_number ? String(booking.suite_number) : null} />
                <DField label="Floor" value={booking.floor_number ? String(booking.floor_number) : null} />
              </Section>

              {/* Appliances */}
              <Section title="Appliances & Services">
                <DField label="Appliances" value={appliances} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <DBool label="Installation" value={booking.installation as boolean} />
                  <DBool label="Old Unit Removal" value={booking.removal as boolean} />
                  <DBool label="Elevator Required" value={booking.elevator as boolean} />
                  <DBool label="Stair Carry" value={booking.stair_carry as boolean} />
                </div>
              </Section>

              {/* Scheduling */}
              <Section title="Scheduling">
                <DField label="Preferred Date" value={booking.preferred_date ? String(booking.preferred_date) : null} />
                <DField label="Alternate Date" value={booking.alternate_date ? String(booking.alternate_date) : null} />
                <DField label="Time Window" value={booking.time_window ? String(booking.time_window) : null} />
                <DField label="Access Notes" value={booking.access_notes ? String(booking.access_notes) : null} />
              </Section>

              {/* Builder */}
              {booking.project_type === "builder" && (
                <Section title="Builder / Commercial">
                  <DField label="Company" value={booking.company_name ? String(booking.company_name) : null} />
                  <DField label="Unit Count" value={booking.unit_count ? String(booking.unit_count) : null} />
                  <DField label="Site Contact" value={booking.site_contact_name ? String(booking.site_contact_name) : null} />
                  <DField label="Site Phone" value={booking.site_contact_phone ? String(booking.site_contact_phone) : null} />
                </Section>
              )}

              {/* Notes */}
              {booking.notes && (
                <Section title="Notes">
                  <p style={{ fontSize: "14px", color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{String(booking.notes)}</p>
                </Section>
              )}

              {/* Photos */}
              <div style={{ marginBottom: 28 }}>
                <PhotoGallery
                  bookingId={String(booking.id)}
                  photos={data.photos}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Signature (admin, In Progress+) */}
              {showSignature && (
                <div style={{ marginBottom: 28 }}>
                  <SignatureCapture
                    bookingId={String(booking.id)}
                    signatureUrl={signatureUrl}
                    onSaved={setSignatureUrl}
                  />
                </div>
              )}

              {/* Quote & Invoice (admin only) */}
              {isAdmin && (
                <QuotePanel
                  bookingId={String(booking.id)}
                  customerEmail={String(booking.email ?? "")}
                  customerName={String(booking.full_name ?? "")}
                  quote={data.quote}
                  invoice={data.invoice}
                  invoiceUrl={data.invoiceUrl}
                />
              )}

              {/* Activity log (admin only) */}
              {isAdmin && (
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--hairline)" }}>
                  <ActivityLog bookingId={String(booking.id)} isAdmin={isAdmin} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
