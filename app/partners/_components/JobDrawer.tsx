"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./PortalShell";
import ActivityLog from "./ActivityLog";
import PhotoGallery from "./PhotoGallery";
import SignatureCapture from "./SignatureCapture";

/* ─── Types ─────────────────────────────────────────────── */
type LineItem = { description: string; amount: string };
interface Photo      { id: string; url: string; uploaded_by: string | null; created_at: string }
interface Quote      { id: string; line_items: LineItem[]; total: number; status: string; sent_at?: string | null }
interface Invoice    { id: string; amount: number; status: string; stripe_checkout_url?: string | null; public_token: string; paid_at?: string | null }
interface Booking    { [key: string]: unknown }
interface TeamMember { id: string; name: string; role: string; color: string }
interface Assignment {
  id: string; scheduled_date: string; time_start: string; time_end: string;
  booking_id: string; team_member_id: string;
  fp_team_members: TeamMember;
}

/* ─── Stage config ───────────────────────────────────────── */
const STAGES = [
  { label: "New",         nextStatus: "quoted",      nextLabel: "Move to Quoted" },
  { label: "Quoted",      nextStatus: "confirmed",   nextLabel: "Move to Confirmed" },
  { label: "Confirmed",   nextStatus: "scheduled",   nextLabel: "Move to Scheduled" },
  { label: "Scheduled",   nextStatus: "in progress", nextLabel: "Start Job" },
  { label: "In Progress", nextStatus: "completed",   nextLabel: "Mark as Complete" },
  { label: "Done",        nextStatus: null as string | null, nextLabel: null as string | null },
];

function getStageIndex(status: string): number {
  if (["pending"].includes(status)) return 0;
  if (["quoted"].includes(status)) return 1;
  if (["confirmed"].includes(status)) return 2;
  if (["scheduled"].includes(status)) return 3;
  if (["in progress"].includes(status)) return 4;
  if (["completed", "paid"].includes(status)) return 5;
  return 0;
}

const CHECKLIST_KEYS = ["areaClean", "appliancesTested", "packagingRemoved"] as const;
type ChecklistKey = typeof CHECKLIST_KEYS[number];
const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  areaClean: "Work area cleaned up",
  appliancesTested: "All appliances tested & working",
  packagingRemoved: "All packaging removed",
};

/* ─── Helpers ────────────────────────────────────────────── */
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
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px", paddingBottom: 8, borderBottom: "1px solid var(--hairline)" }}>
      {children}
    </p>
  );
}

/* ─── Schedule Panel ────────────────────────────────────── */
function SchedulePanel({ bookingId, preferredDate, onScheduled }: {
  bookingId: string;
  preferredDate?: string | null;
  onScheduled: (newStatus: string) => void;
}) {
  const [loading, setLoading]               = useState(true);
  const [team, setTeam]                     = useState<TeamMember[]>([]);
  const [assignments, setAssignments]       = useState<Assignment[]>([]);
  const [rescheduling, setRescheduling]     = useState(false);
  const [schedDate, setSchedDate]           = useState(() => preferredDate || new Date().toISOString().split("T")[0]);
  const [schedWindow, setSchedWindow]       = useState("Morning");
  const [schedTimeStart, setSchedTimeStart] = useState("10:00");
  const [schedTimeEnd, setSchedTimeEnd]     = useState("12:00");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [saving, setSaving]                 = useState(false);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [teamRes, assignRes] = await Promise.all([
        fetch("/api/partners/team"),
        fetch(`/api/partners/schedule?booking_id=${bookingId}`),
      ]);
      const [teamData, assignData] = await Promise.all([teamRes.json(), assignRes.json()]);
      setTeam(teamData.members ?? []);
      setAssignments(assignData.assignments ?? []);
      setLoading(false);
    }
    load();
  }, [bookingId]);

  async function handleSchedule() {
    if (!selectedMembers.length || !schedDate || saving) return;
    const times =
      schedWindow === "Afternoon" ? { time_start: "12:00", time_end: "16:00" }
      : schedWindow === "Anytime"   ? { time_start: "08:00", time_end: "16:00" }
      : schedWindow === "Custom"    ? { time_start: schedTimeStart, time_end: schedTimeEnd }
      :                               { time_start: "08:00", time_end: "12:00" };
    setSaving(true);
    const results = await Promise.all(
      selectedMembers.map(memberId =>
        fetch("/api/partners/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: bookingId, team_member_id: memberId, scheduled_date: schedDate, time_window: schedWindow, ...times }),
        }).then(r => r.json())
      )
    );
    const newAssignments: Assignment[] = results
      .filter(r => r.assignment)
      .map(r => ({ ...r.assignment, fp_team_members: team.find(m => m.id === r.assignment.team_member_id)! }));
    setAssignments(prev => {
      const newIds = new Set(newAssignments.map(a => a.id));
      return [...prev.filter(a => !newIds.has(a.id)), ...newAssignments];
    });
    setSaving(false);
    setRescheduling(false);
    setSelectedMembers([]);
    onScheduled("scheduled");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/partners/schedule/${id}`, { method: "DELETE" });
    const next = assignments.filter(a => a.id !== id);
    setAssignments(next);
    setDeletingId(null);
    if (next.length === 0) onScheduled("confirmed");
  }

  function fmtDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-CA", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  }

  function fmt12h(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
  }

  function fmtWindow(ts: string, te: string) {
    if (ts === "08:00" && te === "12:00") return "Morning (8am–12pm)";
    if (ts === "12:00" && te === "16:00") return "Afternoon (12pm–4pm)";
    if (ts === "08:00" && te === "16:00") return "Anytime (8am–4pm)";
    return `${fmt12h(ts)} – ${fmt12h(te)}`;
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: "13px",
    border: "1px solid var(--border)", borderRadius: 6,
    backgroundColor: "var(--input-bg)", color: "var(--text)",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  if (loading) return <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Loading…</p>;

  const showForm = rescheduling || assignments.length === 0;

  return (
    <div>
      {/* Existing assignments */}
      {assignments.length > 0 && !rescheduling && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {assignments.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", backgroundColor: "var(--hover)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: a.fp_team_members?.color ?? "#999", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{fmtDate(a.scheduled_date)}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)" }}>{fmtWindow(a.time_start, a.time_end)} · {a.fp_team_members?.name ?? "—"}</p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                style={{ background: "none", border: "none", fontSize: "11px", color: "#B44A2C", cursor: "pointer", textDecoration: "underline", padding: "2px 4px" }}
              >
                {deletingId === a.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
          <button
            onClick={() => { setRescheduling(true); setSelectedMembers([]); }}
            style={{ alignSelf: "flex-start", background: "none", border: "none", fontSize: "12px", color: "var(--text-3)", cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            + Add another assignment
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ backgroundColor: "var(--hover)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Date</label>
              <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Time Window</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Morning", "Afternoon", "Anytime", "Custom"].map(w => (
                  <button key={w} onClick={() => setSchedWindow(w)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 6, fontSize: "11px", fontWeight: 600,
                    backgroundColor: schedWindow === w ? "var(--text)" : "transparent",
                    color: schedWindow === w ? "var(--bg)" : "var(--text-3)",
                    border: "1px solid var(--border)", cursor: "pointer",
                  }}>{w}</button>
                ))}
              </div>
              {schedWindow === "Custom" && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>From</label>
                    <input type="time" value={schedTimeStart} onChange={e => setSchedTimeStart(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>To</label>
                    <input type="time" value={schedTimeEnd} onChange={e => setSchedTimeEnd(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Assign To</label>
              {team.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>No team members yet — add some from the Schedule page.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {team.map(m => {
                    const checked = selectedMembers.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMembers(prev => checked ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, border: `1px solid ${checked ? "var(--text)" : "var(--border)"}`, backgroundColor: checked ? "var(--hover)" : "transparent", cursor: "pointer" }}
                      >
                        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: m.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: checked ? 600 : 400, color: "var(--text)", flex: 1 }}>{m.name}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-3)", textTransform: "capitalize" }}>{m.role === "both" ? "Driver & Installer" : m.role}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {(() => {
              const customInvalid = schedWindow === "Custom" && (!schedTimeStart || !schedTimeEnd || schedTimeEnd <= schedTimeStart);
              const canSave = !saving && !!schedDate && selectedMembers.length > 0 && !customInvalid;
              return (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {rescheduling && (
                    <button onClick={() => { setRescheduling(false); setSelectedMembers([]); }} style={{ flex: 1, padding: "8px", borderRadius: 6, backgroundColor: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                  )}
                  <button
                    onClick={handleSchedule}
                    disabled={!canSave}
                    style={{ flex: 2, padding: "8px", borderRadius: 6, backgroundColor: "var(--text)", color: "var(--bg)", border: "none", cursor: canSave ? "pointer" : "default", fontSize: "13px", fontWeight: 600, opacity: canSave ? 1 : 0.5 }}
                  >
                    {saving ? "Scheduling…" : "Schedule Job"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Quote / Invoice Panel ─────────────────────────────── */
function QuotePanel({ bookingId, customerEmail, customerName, quote: q0, invoice: i0, invoiceUrl: u0, onPaid }: {
  bookingId: string; customerEmail: string; customerName: string;
  quote: Quote | null; invoice: Invoice | null; invoiceUrl: string | null;
  onPaid?: () => void;
}) {
  const [quote, setQuote]         = useState<Quote | null>(q0);
  const [invoice, setInvoice]     = useState<Invoice | null>(i0);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(u0);
  const [showBuilder, setShowBuilder] = useState(!q0);
  const [lineItems, setLineItems] = useState<LineItem[]>(q0?.line_items ?? [{ description: "", amount: "" }]);
  const [saving, setSaving]       = useState(false);
  const [creating, setCreating]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [emailing, setEmailing]       = useState(false);
  const [emailErr, setEmailErr]       = useState(false);
  const [quoteStatus, setQuoteStatus] = useState<string | null>(q0?.status ?? null);
  const [approving, setApproving]     = useState(false);
  const [invoiceEmailing, setInvoiceEmailing] = useState(false);
  const [invoiceEmailErr, setInvoiceEmailErr] = useState(false);
  const [paying, setPaying]           = useState(false);

  useEffect(() => {
    if (quoteStatus !== "sent" || !quote) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/partners/quotes/${quote.id}/status`);
      if (!res.ok) return;
      const { status } = await res.json();
      setQuoteStatus(status);
      if (status === "approved") clearInterval(iv);
    }, 30_000);
    return () => clearInterval(iv);
  }, [quoteStatus, quote?.id]);

  useEffect(() => {
    if (invoice?.status !== "sent") return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/partners/invoices/${invoice.public_token}/status`);
      if (!res.ok) return;
      const { status } = await res.json();
      setInvoice(prev => prev ? { ...prev, status } : null);
      if (status === "paid") clearInterval(iv);
    }, 30_000);
    return () => clearInterval(iv);
  }, [invoice?.status, invoice?.id]);

  async function emailInvoice() {
    if (!invoice || invoiceEmailing) return;
    setInvoiceEmailing(true);
    setInvoiceEmailErr(false);
    const res = await fetch(`/api/partners/invoices/${invoice.public_token}/email`, { method: "POST" });
    setInvoiceEmailing(false);
    if (res.ok) {
      setInvoice(prev => prev ? { ...prev, status: "sent" } : null);
    } else {
      setInvoiceEmailErr(true);
      setTimeout(() => setInvoiceEmailErr(false), 4000);
    }
  }

  async function markInvoicePaid() {
    if (!invoice || paying) return;
    setPaying(true);
    const res = await fetch(`/api/partners/invoices/${invoice.public_token}/pay`, { method: "POST" });
    setPaying(false);
    if (res.ok) {
      setInvoice(prev => prev ? { ...prev, status: "paid", paid_at: new Date().toISOString() } : null);
      onPaid?.();
    }
  }

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
    if (d.quote) { setQuote(d.quote); setQuoteStatus(d.quote.status ?? null); setShowBuilder(false); }
    setSaving(false);
  }

  async function approveManually() {
    if (!quote || approving) return;
    setApproving(true);
    await fetch(`/api/partners/quotes/${quote.id}/approve`, { method: "POST" });
    setApproving(false);
    setQuoteStatus("approved");
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

  async function emailQuote() {
    if (!quote || emailing) return;
    setEmailing(true);
    setEmailErr(false);
    const res = await fetch(`/api/partners/quotes/${quote.id}/email`, { method: "POST" });
    setEmailing(false);
    if (res.ok) {
      setQuoteStatus("sent");
    } else {
      setEmailErr(true);
      setTimeout(() => setEmailErr(false), 4000);
    }
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <SectionTitle>Quote</SectionTitle>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <button onClick={() => setShowBuilder(true)} style={{ ...btn(false), width: "auto", padding: "5px 12px", fontSize: "11px" }}>Edit Quote</button>
              <button
                onClick={emailQuote}
                disabled={emailing || quoteStatus === "sent" || quoteStatus === "approved"}
                style={{
                  ...btn(true, emailing),
                  ...(emailErr ? { backgroundColor: "#B44A2C", color: "#fff" } : {}),
                  ...((quoteStatus === "sent" || quoteStatus === "approved") ? { backgroundColor: "#111111", color: "#fff", opacity: 0.55, cursor: "default" } : {}),
                  width: "auto", padding: "5px 12px", fontSize: "11px",
                }}
              >
                {emailing ? "Sending…" : emailErr ? "Failed — try again" : (quoteStatus === "sent" || quoteStatus === "approved") ? "Email Sent" : "Email Customer"}
              </button>
              {quoteStatus === "approved" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, backgroundColor: "#1E7E4A18", border: "1px solid #1E7E4A55", fontSize: 11, fontWeight: 700, color: "#1E7E4A", letterSpacing: "0.03em" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1E7E4A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Approved
                </div>
              )}
            </div>
            {quoteStatus === "sent" && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Awaiting customer approval…</span>
                <button onClick={approveManually} disabled={approving} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "var(--hover)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: approving ? "default" : "pointer" }}>
                  {approving ? "Approving…" : "Approve Manually"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {quote && !showBuilder && (
        <div>
          <SectionTitle>Invoice</SectionTitle>
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
                <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)" }}>{fmt(invoice.amount)}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: invoice.status === "paid" ? "#1E7E4A" : invoice.status === "sent" ? "#B45309" : "#3F4A5C",
                  backgroundColor: invoice.status === "paid" ? "#1E7E4A22" : invoice.status === "sent" ? "#B4530922" : "#3F4A5C22",
                  padding: "3px 8px", borderRadius: 99 }}>
                  {invoice.status}
                </span>
              </div>
              {invoice.paid_at && <p style={{ fontSize: "12px", color: "#1E7E4A", margin: "0 0 12px" }}>Paid {new Date(invoice.paid_at).toLocaleDateString("en-CA")}</p>}
              {invoiceUrl && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ backgroundColor: "var(--hover)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 10px", fontSize: "11px", color: "var(--text-2)", wordBreak: "break-all", marginBottom: 8 }}>{invoiceUrl}</div>
                  <button onClick={copyLink} style={btn(false)}>{copied ? "Copied!" : "Copy Payment Link"}</button>
                </div>
              )}
              {invoiceUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <a href={`/api/partners/pdf/invoice/${invoice.public_token}`} target="_blank" rel="noopener noreferrer"
                    style={{ ...btn(false) as React.CSSProperties, width: "auto", padding: "5px 12px", fontSize: "11px", textDecoration: "none", display: "inline-block" }}>
                    Download PDF
                  </a>
                  {invoice.status !== "paid" && (
                    <button
                      onClick={emailInvoice}
                      disabled={invoiceEmailing || invoice.status === "sent"}
                      style={{
                        ...btn(true, invoiceEmailing),
                        ...(invoiceEmailErr ? { backgroundColor: "#B44A2C", color: "#fff" } : {}),
                        ...(invoice.status === "sent" ? { backgroundColor: "#111111", color: "#fff", opacity: 0.55, cursor: "default" } : {}),
                        width: "auto", padding: "5px 12px", fontSize: "11px",
                      }}
                    >
                      {invoiceEmailing ? "Sending…" : invoiceEmailErr ? "Failed — try again" : invoice.status === "sent" ? "Invoice Sent" : "Email Invoice"}
                    </button>
                  )}
                </div>
              )}
              {invoice.status === "sent" && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Awaiting payment…</span>
                  <button onClick={markInvoicePaid} disabled={paying} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "var(--hover)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: paying ? "default" : "pointer" }}>
                    {paying ? "Updating…" : "Mark as Paid"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Stage Progress Bar ─────────────────────────────────── */
function StageStepper({ stageIndex, isAdmin, onJump }: {
  stageIndex: number;
  isAdmin: boolean;
  onJump: (dbStatus: string) => void;
}) {
  const jumpStatuses = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed"];
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--surface)" }}>
      {STAGES.map((s, i) => {
        const done = i < stageIndex;
        const active = i === stageIndex;
        const clickable = isAdmin && i !== stageIndex;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                onClick={() => clickable && onJump(jumpStatuses[i])}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  backgroundColor: done ? "#1E7E4A" : active ? "#111111" : "var(--hover)",
                  border: `2px solid ${done ? "#1E7E4A" : active ? "#111111" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: clickable ? "pointer" : "default",
                  transition: "all 200ms ease",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: active ? "#FFFFFF" : "var(--text-3)" }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: "9px", fontWeight: active ? 700 : 400, color: active ? "var(--text)" : done ? "#1E7E4A" : "var(--text-3)", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ flex: 1, height: 2, backgroundColor: done ? "#1E7E4A" : "var(--border)", margin: "0 6px", marginBottom: 16, transition: "background-color 200ms ease" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Drawer ─────────────────────────────────────────── */
interface DrawerProps {
  bookingId: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, status: string) => void;
  onArchive?: (id: string, archived: boolean) => void;
}

export default function JobDrawer({ bookingId, isAdmin, onClose, onStatusChange, onArchive }: DrawerProps) {
  const router = useRouter();
  const [data, setData]           = useState<{ booking: Booking; photos: Photo[]; quote: Quote | null; invoice: Invoice | null; invoiceUrl: string | null } | null>(null);
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState<string>("pending");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [archived, setArchived]   = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [blockWarning, setBlockWarning] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({ areaClean: false, appliancesTested: false, packagingRemoved: false });
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setData(null);
    setBlockWarning(null);
    setChecklist({ areaClean: false, appliancesTested: false, packagingRemoved: false });
    const res = await fetch(`/api/partners/jobs/${id}`);
    const d = await res.json();
    setData(d);
    setStatus(String(d.booking?.status ?? "pending"));
    setSignatureUrl(String(d.booking?.signature_url ?? "") || null);
    setArchived(!!d.booking?.archived);
    setInvoiceStatus(d.invoice?.status ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { if (bookingId) load(bookingId); }, [bookingId, load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!bookingId) return null;

  const booking = data?.booking as Record<string, unknown> | undefined;
  const photos = data?.photos ?? [];
  const stageIndex = getStageIndex(status);
  const stage = STAGES[stageIndex];

  // Checklist computed
  const checkSigned = !!signatureUrl;
  const checkPhoto  = photos.length > 0;
  const allManualChecked = CHECKLIST_KEYS.every(k => checklist[k]);

  const showArchiveBtn = isAdmin && ["completed", "paid"].includes(status);

  async function changeStatus(newStatus: string) {
    if (!bookingId) return;
    await fetch(`/api/partners/bookings/${bookingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    onStatusChange?.(bookingId, newStatus);
  }

  async function advanceStage(override = false) {
    if (!stage.nextStatus || advancing) return;
    if (stageIndex === 4 && !override) {
      if (!checkSigned) { setBlockWarning("A customer signature is required before completing this job."); return; }
      if (!checkPhoto)  { setBlockWarning("At least one final photo must be attached before completing."); return; }
      if (!allManualChecked) { setBlockWarning("Please tick all checklist items before marking as complete."); return; }
    }
    setBlockWarning(null);
    setAdvancing(true);
    await changeStatus(stage.nextStatus);
    setAdvancing(false);
  }

  async function archiveJob() {
    if (!bookingId || archiving) return;
    setArchiving(true);
    const next = !archived;
    setArchived(next);
    await fetch(`/api/partners/bookings/${bookingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: next }),
    });
    setArchiving(false);
    onArchive?.(bookingId, next);
    if (next) onClose();
  }

  function toggleCheck(key: ChecklistKey) {
    setChecklist(c => ({ ...c, [key]: !c[key] }));
    setBlockWarning(null);
  }

  const appliances = booking
    ? Array.isArray(booking.appliances) ? (booking.appliances as string[]).join(", ") : String(booking.appliances ?? "—")
    : "";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 80 }} />

      {/* Drawer */}
      <div
        className="fp-drawer"
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)", backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)", zIndex: 90, display: "flex", flexDirection: "column" }}
      >
        {/* Drag handle — mobile only */}
        <div className="fp-drag-handle" style={{ display: "none", width: 40, height: 5, borderRadius: 3, backgroundColor: "var(--border)", margin: "14px auto 0", flexShrink: 0 }} />

        {/* Mobile header */}
        <div className="fp-drawer-header-mobile" style={{ padding: "6px 8px 10px 4px" }}>
          <button onClick={onClose} style={{ width: 48, height: 48, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
            {booking && (
              <>
                <p style={{ fontSize: "10px", color: "var(--text-3)", margin: 0, fontWeight: 600, letterSpacing: "0.04em" }}>
                  {booking.fp_order_number ? `Order #${booking.fp_order_number}` : "Job Details"}
                </p>
                <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(booking.full_name ?? "")}
                </p>
              </>
            )}
          </div>
          {booking && <div style={{ paddingRight: 12, flexShrink: 0 }}><StatusBadge status={status} /></div>}
        </div>

        {/* Desktop header */}
        <div className="fp-drawer-header-desktop" style={{ padding: "16px 20px", borderBottom: "1px solid var(--hairline)", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0, backgroundColor: "var(--surface)" }}>
          <div>
            {booking && (
              <>
                <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>
                  Order #{String(booking.fp_order_number ?? "—")}
                </p>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
                  {String(booking.full_name ?? "")}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  {!!booking.phone && <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{String(booking.phone)}</span>}
                  {!!booking.phone && !!booking.email && <span style={{ fontSize: "12px", color: "var(--border)" }}>·</span>}
                  {!!booking.email && <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{String(booking.email)}</span>}
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {booking && <StatusBadge status={status} />}
            {showArchiveBtn && (
              <button onClick={archiveJob} disabled={archiving} style={{ padding: "4px 10px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 6, fontSize: "11px", fontWeight: 600, color: "var(--text-3)", cursor: archiving ? "default" : "pointer", whiteSpace: "nowrap" }}>
                {archiving ? "…" : archived ? "Unarchive" : "Archive"}
              </button>
            )}
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: "var(--hover)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          </div>
        </div>

        {/* ── Progress stepper ── */}
        {isAdmin && (
          <StageStepper
            stageIndex={stageIndex}
            isAdmin={isAdmin}
            onJump={(dbStatus) => changeStatus(dbStatus)}
          />
        )}

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>

          {/* Skeleton */}
          {loading && (
            <div style={{ animation: "fp-fade-in 150ms ease" }}>
              {[100, 55, 80, 45, 70, 90].map((w, i) => (
                <div key={i} style={{ height: i % 3 === 0 ? 14 : 11, width: `${w}%`, borderRadius: 4, backgroundColor: "var(--border)", marginBottom: i % 3 === 2 ? 22 : 8, opacity: 0.55 }} />
              ))}
            </div>
          )}

          {!loading && data && booking && (
            <>
              {/* ── Stage 0: New — full job details ── */}
              {stageIndex === 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionTitle>Job Details</SectionTitle>
                  <DField label="Address" value={String(booking.address ?? "")} />
                  <DField label="Suite / Unit" value={booking.suite_number ? String(booking.suite_number) : null} />
                  <DField label="Floor" value={booking.floor_number ? String(booking.floor_number) : null} />
                  <DField label="Appliances" value={appliances} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 4 }}>
                    <DBool label="Installation" value={booking.installation as boolean} />
                    <DBool label="Old Unit Removal" value={booking.removal as boolean} />
                    <DBool label="Elevator Required" value={booking.elevator as boolean} />
                    <DBool label="Stair Carry" value={booking.stair_carry as boolean} />
                  </div>
                  {!!booking.notes && (
                    <div style={{ marginTop: 8 }}>
                      <DField label="Notes" value={String(booking.notes)} />
                    </div>
                  )}
                  {booking.project_type === "builder" && (
                    <div style={{ marginTop: 16 }}>
                      <SectionTitle>Builder / Commercial</SectionTitle>
                      <DField label="Company" value={booking.company_name ? String(booking.company_name) : null} />
                      <DField label="Unit Count" value={booking.unit_count ? String(booking.unit_count) : null} />
                      <DField label="Site Contact" value={booking.site_contact_name ? String(booking.site_contact_name) : null} />
                      <DField label="Site Phone" value={booking.site_contact_phone ? String(booking.site_contact_phone) : null} />
                    </div>
                  )}
                </div>
              )}

              {/* ── Stage 1: Quoted / Stage 2: Confirmed — quote panel ── */}
              {(stageIndex === 1 || stageIndex === 2) && isAdmin && (
                <div style={{ marginBottom: 28 }}>
                  <QuotePanel
                    bookingId={String(booking.id)}
                    customerEmail={String(booking.email ?? "")}
                    customerName={String(booking.full_name ?? "")}
                    quote={data.quote}
                    invoice={data.invoice}
                    invoiceUrl={data.invoiceUrl}
                    onPaid={() => {
                      router.refresh();
                    }}
                  />
                </div>
              )}

              {/* ── Schedule panel (admin, Confirmed+) ── */}
              {isAdmin && stageIndex >= 2 && stageIndex < 5 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionTitle>Schedule</SectionTitle>
                  <SchedulePanel
                    bookingId={String(booking.id)}
                    preferredDate={booking.preferred_date ? String(booking.preferred_date) : null}
                    onScheduled={(newStatus) => {
                      setStatus(newStatus);
                      onStatusChange?.(bookingId!, newStatus);
                    }}
                  />
                </div>
              )}

              {/* ── Stage 3: Scheduled — appointment details ── */}
              {stageIndex === 3 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionTitle>Appointment</SectionTitle>
                  <DField label="Preferred Date" value={booking.preferred_date ? String(booking.preferred_date) : null} />
                  <DField label="Alternate Date" value={booking.alternate_date ? String(booking.alternate_date) : null} />
                  <DField label="Time Window" value={booking.time_window ? String(booking.time_window) : null} />
                  <DField label="Address" value={String(booking.address ?? "")} />
                  <DField label="Suite / Unit" value={booking.suite_number ? String(booking.suite_number) : null} />
                  <DField label="Floor" value={booking.floor_number ? String(booking.floor_number) : null} />
                  <DField label="Access Notes" value={booking.access_notes ? String(booking.access_notes) : null} />
                  <DField label="Appliances" value={appliances} />
                </div>
              )}

              {/* ── Stage 4: In Progress — signature + checklist ── */}
              {stageIndex === 4 && (
                <div style={{ marginBottom: 28 }}>
                  {/* Signature */}
                  <div style={{ marginBottom: 28 }}>
                    <SignatureCapture
                      bookingId={String(booking.id)}
                      signatureUrl={signatureUrl}
                      onSaved={setSignatureUrl}
                    />
                  </div>

                  {/* Completion checklist */}
                  <SectionTitle>Completion Checklist</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Auto: signed */}
                    <CheckItem label="Customer signed" checked={checkSigned} auto />
                    {/* Manual items */}
                    {CHECKLIST_KEYS.map(key => (
                      <CheckItem
                        key={key}
                        label={CHECKLIST_LABELS[key]}
                        checked={checklist[key]}
                        onClick={() => toggleCheck(key)}
                      />
                    ))}
                    {/* Auto: photo */}
                    <CheckItem label={`Final photo attached${photos.length > 0 ? ` (${photos.length})` : " — upload below"}`} checked={checkPhoto} auto />
                  </div>
                </div>
              )}

              {/* ── Stage 5: Done — invoice summary ── */}
              {stageIndex === 5 && isAdmin && data.invoice && (
                <div style={{ marginBottom: 28 }}>
                  <SectionTitle>Invoice</SectionTitle>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)" }}>{fmt(data.invoice.amount)}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: invoiceStatus === "paid" ? "#1E7E4A" : "#3F4A5C", backgroundColor: invoiceStatus === "paid" ? "#1E7E4A22" : "#3F4A5C22", padding: "3px 8px", borderRadius: 99 }}>
                      {invoiceStatus ?? data.invoice.status}
                    </span>
                  </div>
                  {invoiceStatus !== "paid" && (
                    <button
                      onClick={async () => {
                        if (markingPaid) return;
                        setMarkingPaid(true);
                        const res = await fetch(`/api/partners/invoices/${data.invoice!.public_token}/pay`, { method: "POST" });
                        setMarkingPaid(false);
                        if (res.ok) {
                          setInvoiceStatus("paid");
                          setStatus("paid");
                          onStatusChange?.(bookingId!, "paid");
                          router.refresh();
                        }
                      }}
                      disabled={markingPaid}
                      style={{ padding: "6px 14px", backgroundColor: "var(--hover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "12px", fontWeight: 600, color: "var(--text-2)", cursor: markingPaid ? "default" : "pointer", marginBottom: 8 }}
                    >
                      {markingPaid ? "Marking…" : "Mark as Paid"}
                    </button>
                  )}
                  {data.invoiceUrl && (
                    <div>
                      <a href={`/api/partners/pdf/invoice/${data.invoice.public_token}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-block", padding: "7px 16px", backgroundColor: "var(--hover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "12px", color: "var(--text-2)", textDecoration: "none", fontWeight: 600, marginTop: 4 }}>
                        Download Invoice PDF
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* ── Always: Photos ── */}
              <div style={{ marginBottom: 28 }}>
                <PhotoGallery
                  bookingId={String(booking.id)}
                  photos={photos}
                  isAdmin={isAdmin}
                  onPhotosChange={newPhotos =>
                    setData(d => d ? { ...d, photos: newPhotos } : d)
                  }
                />
              </div>

              {/* ── Always: Activity log (admin) ── */}
              {isAdmin && (
                <div style={{ paddingTop: 24, borderTop: "1px solid var(--hairline)", paddingBottom: 24 }}>
                  <ActivityLog bookingId={String(booking.id)} isAdmin={isAdmin} />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sticky footer: advance button (admin only) ── */}
        {isAdmin && !loading && data && stage.nextStatus && (
          <div style={{ flexShrink: 0, borderTop: "1px solid var(--hairline)", padding: "14px 20px", backgroundColor: "var(--surface)" }}>
            {blockWarning && (
              <div style={{ backgroundColor: "#B44A2C10", border: "1px solid #B44A2C33", borderRadius: 8, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: "13px", color: "#B44A2C", flex: 1, lineHeight: 1.4 }}>{blockWarning}</span>
                <button onClick={() => advanceStage(true)} style={{ flexShrink: 0, padding: "4px 12px", backgroundColor: "transparent", border: "1px solid #B44A2C", borderRadius: 6, fontSize: "11px", fontWeight: 700, color: "#B44A2C", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Override & Continue
                </button>
              </div>
            )}
            <button
              onClick={() => advanceStage(false)}
              disabled={advancing}
              style={{
                width: "100%", padding: "12px", borderRadius: 8, border: "none",
                backgroundColor: advancing ? "var(--border)" : "#111111",
                color: advancing ? "var(--text-3)" : "#FFFFFF",
                fontSize: "14px", fontWeight: 700, cursor: advancing ? "default" : "pointer",
                letterSpacing: "0.02em", transition: "background-color 150ms ease",
              }}
            >
              {advancing ? "Updating…" : `${stage.nextLabel} →`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Checklist item ─────────────────────────────────────── */
function CheckItem({ label, checked, auto, onClick }: { label: string; checked: boolean; auto?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={!auto ? onClick : undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: `1px solid ${checked ? "#1E7E4A44" : "var(--border)"}`, backgroundColor: checked ? "#1E7E4A08" : "var(--hover)", cursor: auto ? "default" : "pointer", transition: "all 150ms ease" }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? "#1E7E4A" : "var(--border)"}`,
        backgroundColor: checked ? "#1E7E4A" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 150ms ease",
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: "13px", color: checked ? "var(--text)" : "var(--text-2)", fontWeight: checked ? 600 : 400, flex: 1 }}>{label}</span>
      {auto && <span style={{ fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.04em" }}>AUTO</span>}
    </div>
  );
}
