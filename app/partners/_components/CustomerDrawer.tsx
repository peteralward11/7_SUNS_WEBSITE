"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./PortalShell";
import NewJobDrawer from "./NewJobDrawer";

interface Job {
  id: string;
  fp_order_number?: string | null;
  full_name: string;
  address?: string | null;
  appliances?: unknown;
  status?: string | null;
  preferred_date?: string | null;
  created_at: string;
  archived?: boolean | null;
}

interface CustomerData {
  email: string;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  ltv: number;
  jobs: Job[];
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function getAppliances(job: Job) {
  if (Array.isArray(job.appliances)) return (job.appliances as string[]).join(", ");
  return String(job.appliances ?? "—");
}

export default function CustomerDrawer({
  email,
  onClose,
  onJobClick,
  onDeleted,
}: {
  email: string | null;
  onClose: () => void;
  onJobClick: (id: string) => void;
  onDeleted?: (email: string) => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "deleting">("idle");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (e: string) => {
    setLoading(true);
    setData(null);
    const res = await fetch(`/api/partners/customers/${encodeURIComponent(e)}`);
    const d = await res.json();
    setData(d.customer ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (email) load(email);
  }, [email, load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleJobCreated(bookingId: string) {
    setNewJobOpen(false);
    onClose();
    onJobClick(bookingId);
  }

  async function handleDelete() {
    if (!email) return;
    setDeleteState("deleting");
    await fetch(`/api/partners/customers/${encodeURIComponent(email)}`, { method: "DELETE" });
    onDeleted?.(email);
    onClose();
  }

  function startEditing() {
    if (!data) return;
    setEditName(data.full_name);
    setEditPhone(data.phone ?? "");
    setEditAddress(data.address ?? "");
    setEditing(true);
  }

  async function handleSave() {
    if (!email) return;
    setSaving(true);
    await fetch(`/api/partners/customers/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: editName, phone: editPhone, address: editAddress }),
    });
    setData(d => d ? { ...d, full_name: editName, phone: editPhone || null, address: editAddress || null } : d);
    setSaving(false);
    setEditing(false);
  }

  if (!email) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 80 }} />

      <div className="fp-drawer" style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(520px, 100vw)",
        backgroundColor: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        animation: "fp-slide-in 220ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Drag handle — mobile only */}
        <div className="fp-drag-handle" style={{ display: "none", width: 40, height: 5, borderRadius: 3, backgroundColor: "var(--border)", margin: "14px auto 0", flexShrink: 0 }} />

        {/* Mobile header */}
        <div className="fp-drawer-header-mobile" style={{ padding: "6px 16px 10px 4px" }}>
          <button onClick={onClose} style={{ width: 48, height: 48, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
            <p style={{ fontSize: "10px", color: "var(--text-3)", margin: 0, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Customer Profile</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data?.full_name ?? email}</p>
          </div>
          {data && (
            <button onClick={() => setNewJobOpen(true)} style={{ padding: "8px 14px", backgroundColor: "#E8A33D", border: "none", borderRadius: 8, fontSize: "13px", fontWeight: 700, color: "#111111", cursor: "pointer", flexShrink: 0, marginRight: 8 }}>
              + Job
            </button>
          )}
        </div>

        {/* Desktop header */}
        <div className="fp-drawer-header-desktop" style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--hairline)",
          alignItems: "flex-start",
          justifyContent: "space-between",
          position: "sticky", top: 0,
          backgroundColor: "var(--surface)",
          zIndex: 10,
        }}>
          <div>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 4px" }}>
              Customer Profile
            </p>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              {data?.full_name ?? email}
            </h2>
            {data && (
              <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0" }}>{email}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {data && (
              <>
                <button
                  onClick={() => setNewJobOpen(true)}
                  style={{
                    padding: "5px 12px",
                    backgroundColor: "#111111",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#ffffff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  + Add Job
                </button>
                <button
                  onClick={() => router.push(`/partners/customers/${encodeURIComponent(email)}`)}
                  style={{
                    padding: "5px 12px",
                    backgroundColor: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Full page →
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: "var(--hover)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
                fontSize: "18px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
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
              {[80, 55, 100, 60, 75].map((w, i) => (
                <div key={i} style={{ height: i % 2 === 0 ? 13 : 10, width: `${w}%`, borderRadius: 4, backgroundColor: "var(--border)", marginBottom: 10, opacity: 0.6 }} />
              ))}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Contact info */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--hairline)" }}>
                  <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: 0 }}>Contact</p>
                  {!editing && (
                    <button onClick={startEditing} style={{ background: "none", border: "none", padding: 0, fontSize: "11px", color: "var(--text-3)", cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  )}
                </div>

                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Name", value: editName, set: setEditName },
                      { label: "Phone", value: editPhone, set: setEditPhone },
                      { label: "Address", value: editAddress, set: setEditAddress },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>{label}</p>
                        <input
                          value={value}
                          onChange={e => set(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid var(--border)", borderRadius: 6, backgroundColor: "var(--input-bg)", color: "var(--text)", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ padding: "6px 16px", backgroundColor: "#111111", border: "none", borderRadius: 6, fontSize: "12px", fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer" }}
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        style={{ padding: "6px 12px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 6, fontSize: "12px", color: "var(--text-3)", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>Email</p>
                      <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>{email}</p>
                    </div>
                    {data.phone && (
                      <div>
                        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>Phone</p>
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>{data.phone}</p>
                      </div>
                    )}
                    {data.address && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 3px" }}>Address</p>
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>{data.address}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
                <div style={{ backgroundColor: "var(--hover)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{data.jobs.length}</p>
                  <p style={{ fontSize: "10px", color: "var(--text-3)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Jobs</p>
                </div>
                <div style={{ backgroundColor: "var(--hover)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                    {data.jobs.filter(j => j.status === "paid").length}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--text-3)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Paid Jobs</p>
                </div>
                <div style={{ backgroundColor: data.ltv > 0 ? "rgba(30,126,74,0.06)" : "var(--hover)", borderRadius: 8, padding: "14px 16px", border: `1px solid ${data.ltv > 0 ? "rgba(30,126,74,0.2)" : "var(--border)"}` }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: data.ltv > 0 ? "#1E7E4A" : "var(--text)", margin: 0, lineHeight: 1.1 }}>
                    {data.ltv > 0 ? fmtCurrency(data.ltv) : "—"}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--text-3)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Lifetime Value</p>
                </div>
              </div>

              {/* Job history */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid var(--hairline)" }}>
                  Job History ({data.jobs.length})
                </p>
                {data.jobs.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>No jobs found.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.jobs.map(job => (
                      <div
                        key={job.id}
                        onClick={() => { onClose(); onJobClick(job.id); }}
                        style={{
                          padding: "12px 14px",
                          backgroundColor: "var(--hover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          cursor: "pointer",
                          opacity: job.archived ? 0.6 : 1,
                          transition: "border-color 150ms ease",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--text-3)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                              {job.fp_order_number ? `#${job.fp_order_number}` : "—"}
                            </span>
                            {job.archived && (
                              <span style={{ fontSize: "10px", color: "var(--text-3)", backgroundColor: "var(--border)", borderRadius: 4, padding: "1px 6px" }}>Archived</span>
                            )}
                          </div>
                          <StatusBadge status={job.status ?? "pending"} />
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-2)", margin: "0 0 2px" }}>{getAppliances(job)}</p>
                        {job.address && <p style={{ fontSize: "11px", color: "var(--text-3)", margin: 0 }}>{job.address}</p>}
                        <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "4px 0 0" }}>{fmt(job.preferred_date ?? job.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Danger zone */}
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                {deleteState === "idle" && (
                  <button
                    onClick={() => setDeleteState("confirm")}
                    style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "#B44A2C", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Delete customer…
                  </button>
                )}
                {deleteState === "confirm" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "12px", color: "var(--text-2)" }}>Delete all jobs and data for this customer?</span>
                    <button
                      onClick={handleDelete}
                      style={{ padding: "4px 12px", backgroundColor: "#B44A2C", border: "none", borderRadius: 6, fontSize: "11px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleteState("idle")}
                      style={{ padding: "4px 10px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 6, fontSize: "11px", color: "var(--text-3)", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {deleteState === "deleting" && (
                  <span style={{ fontSize: "12px", color: "var(--text-3)" }}>Deleting…</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <NewJobDrawer
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        onCreated={handleJobCreated}
        customerName={data?.full_name ?? email}
        customerEmail={email}
        customerPhone={data?.phone ?? ""}
        customerAddress={data?.address ?? ""}
      />
    </>
  );
}
