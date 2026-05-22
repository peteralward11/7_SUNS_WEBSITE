"use client";
import { useState } from "react";

interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  email?: string | null;
}

const COLORS = ["#E8A33D", "#1F6FEB", "#1E7E4A", "#B44A2C", "#7C3AED", "#0891B2"];
const ROLES = [
  { value: "driver",    label: "Driver" },
  { value: "installer", label: "Installer" },
  { value: "both",      label: "Driver & Installer" },
];

function roleLabel(r: string) {
  return ROLES.find(x => x.value === r)?.label ?? r;
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid var(--border)",
  borderRadius: 6, fontSize: "13px", backgroundColor: "var(--input-bg)",
  color: "var(--text)", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const BTN_PRIMARY: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 6, border: "none",
  backgroundColor: "#111111", color: "#ffffff",
  fontSize: "13px", fontWeight: 600, cursor: "pointer",
};

const BTN_GHOST: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 6,
  border: "1px solid var(--border)", backgroundColor: "transparent",
  color: "var(--text-2)", fontSize: "13px", cursor: "pointer",
};

const ICON_BTN: React.CSSProperties = {
  padding: "5px", borderRadius: 5, border: "none",
  backgroundColor: "transparent", color: "var(--text-3)",
  cursor: "pointer", display: "flex", alignItems: "center",
};

export default function TeamPage({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<Record<string, "sending" | "sent" | "error">>({});

  // Form state
  const [name, setName]   = useState("");
  const [role, setRole]   = useState("driver");
  const [color, setColor] = useState(COLORS[0]);
  const [email, setEmail] = useState("");

  function openAdd() {
    setEditingId(null);
    setName(""); setRole("driver"); setColor(COLORS[0]); setEmail("");
    setShowForm(true);
  }

  function openEdit(m: Member) {
    setEditingId(m.id);
    setName(m.name); setRole(m.role); setColor(m.color); setEmail(m.email ?? "");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);

    if (editingId) {
      // Edit existing
      const res = await fetch(`/api/partners/team/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, color, email }),
      });
      const d = await res.json();
      if (d.member) {
        setMembers(prev => prev.map(m => m.id === editingId ? d.member : m));
      }
    } else {
      // Create new
      const res = await fetch("/api/partners/team", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, color, email }),
      });
      const d = await res.json();
      if (d.member) {
        setMembers(prev => [...prev, d.member].sort((a, b) => a.name.localeCompare(b.name)));
        // Send invite if email provided
        if (email.trim()) {
          const memberId = d.member.id;
          setInviteStatus(s => ({ ...s, [memberId]: "sending" }));
          const iRes = await fetch("/api/partners/invite", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name }),
          });
          setInviteStatus(s => ({ ...s, [memberId]: iRes.ok ? "sent" : "error" }));
        }
      }
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
  }

  async function resendInvite(m: Member) {
    if (!m.email) return;
    setInviteStatus(s => ({ ...s, [m.id]: "sending" }));
    const res = await fetch("/api/partners/invite", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: m.email, name: m.name }),
    });
    setInviteStatus(s => ({ ...s, [m.id]: res.ok ? "sent" : "error" }));
  }

  async function deleteMember(id: string) {
    if (!confirm("Remove this team member? This won't delete their scheduled assignments.")) return;
    setDeleting(id);
    await fetch(`/api/partners/team/${id}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      {/* Add form */}
      {showForm && (
        <div style={{
          backgroundColor: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "20px 24px", marginBottom: 20,
        }}>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 16px" }}>
            {editingId ? "Edit Team Member" : "Add Team Member"}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 5 }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={INPUT} />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 5 }}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ ...INPUT }}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 5 }}>Email (for portal access)</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="team@example.com" style={INPUT} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 8 }}>Colour</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", border: "none",
                    backgroundColor: c, cursor: "pointer",
                    outline: color === c ? `3px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
          {!editingId && email.trim() && (
            <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: 14 }}>
              An invitation email will be sent to {email.trim()} with login instructions.
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving || !name.trim()} style={{ ...BTN_PRIMARY, opacity: saving || !name.trim() ? 0.6 : 1 }}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Member"}
            </button>
            <button onClick={cancelForm} style={BTN_GHOST}>Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
        {!showForm && (
          <button onClick={openAdd} style={BTN_PRIMARY}>
            + Add Member
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {members.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-3)" }}>
            <p style={{ fontSize: "14px", margin: 0 }}>No team members yet. Add one above.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--hover)" }}>
                <Th></Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Email</Th>
                <Th>Portal Access</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const status = inviteStatus[m.id];
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: i < members.length - 1 ? "1px solid var(--hairline)" : "none",
                      opacity: deleting === m.id ? 0.4 : 1,
                    }}
                  >
                    {/* Color swatch */}
                    <td style={{ padding: "12px 16px", width: 40 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: m.color }} />
                    </td>
                    {/* Name */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                    </td>
                    {/* Role */}
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-2)" }}>
                      {roleLabel(m.role)}
                    </td>
                    {/* Email */}
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-3)" }}>
                      {m.email ?? <span style={{ color: "var(--border)" }}>—</span>}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      {m.email ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                            textTransform: "uppercase", padding: "2px 8px", borderRadius: 99,
                            backgroundColor: status === "error" ? "#FEE2E2" : status === "sent" ? "#D1FAE5" : "#F0FDF4",
                            color: status === "error" ? "#B91C1C" : "#166534",
                          }}>
                            {status === "sending" ? "Sending…" : status === "error" ? "Failed" : status === "sent" ? "Invite sent" : "Invited"}
                          </span>
                          <button
                            onClick={() => resendInvite(m)}
                            disabled={status === "sending"}
                            title="Resend invite"
                            style={{ ...ICON_BTN, fontSize: "11px", color: "var(--text-3)" }}
                          >
                            ↺
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>No portal access</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => openEdit(m)} style={ICON_BTN} title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteMember(m.id)} disabled={deleting === m.id} style={{ ...ICON_BTN, color: "#B44A2C" }} title="Remove">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-2)" }}>
      {children}
    </th>
  );
}
