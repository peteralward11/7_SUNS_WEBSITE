"use client";
import { useState } from "react";
import type { TeamMember } from "./ScheduleCalendar";

const ROLES = [
  { value: "driver", label: "Driver" },
  { value: "installer", label: "Installer" },
  { value: "both", label: "Driver & Installer" },
];

export default function TeamManageModal({
  open, onClose, team, colorPresets, onTeamChange,
}: {
  open: boolean;
  onClose: () => void;
  team: TeamMember[];
  colorPresets: string[];
  onTeamChange: (t: TeamMember[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("driver");
  const [color, setColor] = useState(colorPresets[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!open) return null;

  function resetForm() { setName(""); setRole("driver"); setColor(colorPresets[0]); setAdding(false); setEditId(null); }

  function startEdit(m: TeamMember) {
    setEditId(m.id); setName(m.name); setRole(m.role); setColor(m.color);
    setAdding(false);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    if (editId) {
      const res = await fetch(`/api/partners/team/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, color }),
      });
      const d = await res.json();
      if (d.member) onTeamChange(team.map(m => m.id === editId ? d.member : m));
    } else {
      const res = await fetch("/api/partners/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, color }),
      });
      const d = await res.json();
      if (d.member) onTeamChange([...team, d.member]);
    }
    setSaving(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/partners/team/${id}`, { method: "DELETE" });
    onTeamChange(team.filter(m => m.id !== id));
    setDeletingId(null);
    if (editId === id) resetForm();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: "13px",
    border: "1px solid var(--border)", borderRadius: 6,
    backgroundColor: "var(--input-bg)", color: "var(--text)",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 120 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(480px, 95vw)", backgroundColor: "var(--surface)",
        borderRadius: 12, border: "1px solid var(--border)", zIndex: 130,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "85vh",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Manage Team</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", color: "var(--text-3)", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Existing members */}
          {team.length === 0 && !adding && (
            <p style={{ fontSize: "13px", color: "var(--text-3)", margin: "0 0 16px" }}>No team members yet. Add your first below.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: team.length > 0 ? 20 : 0 }}>
            {team.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", backgroundColor: "var(--hover)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: m.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{m.name}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", margin: 0, textTransform: "capitalize" }}>{m.role === "both" ? "Driver & Installer" : m.role}</p>
                </div>
                <button onClick={() => startEdit(m)} style={{ background: "none", border: "none", fontSize: "12px", color: "var(--text-3)", cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  style={{ background: "none", border: "none", fontSize: "12px", color: "#B44A2C", cursor: "pointer", textDecoration: "underline" }}
                >
                  {deletingId === m.id ? "…" : "Delete"}
                </button>
              </div>
            ))}
          </div>

          {/* Add / Edit form */}
          {(adding || editId) ? (
            <div style={{ backgroundColor: "var(--hover)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-2)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {editId ? "Edit Member" : "Add Member"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Name</label>
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Role</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {ROLES.map(r => (
                      <button key={r.value} onClick={() => setRole(r.value)} style={{
                        flex: 1, padding: "7px 4px", borderRadius: 6, fontSize: "11px", fontWeight: 600,
                        backgroundColor: role === r.value ? "var(--text)" : "transparent",
                        color: role === r.value ? "var(--bg)" : "var(--text-3)",
                        border: "1px solid var(--border)", cursor: "pointer",
                      }}>{r.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Color</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {colorPresets.map(c => (
                      <button key={c} onClick={() => setColor(c)} style={{
                        width: 26, height: 26, borderRadius: "50%", backgroundColor: c, border: `3px solid ${color === c ? "var(--text)" : "transparent"}`,
                        cursor: "pointer", padding: 0, outline: "none",
                      }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={resetForm} style={{ flex: 1, padding: "8px", borderRadius: 6, backgroundColor: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving || !name.trim()} style={{ flex: 2, padding: "8px", borderRadius: 6, backgroundColor: "var(--text)", color: "var(--bg)", border: "none", cursor: saving ? "default" : "pointer", fontSize: "13px", fontWeight: 600 }}>
                    {saving ? "Saving…" : editId ? "Save Changes" : "Add Member"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{
              width: "100%", padding: "10px", borderRadius: 8, backgroundColor: "transparent",
              border: "1.5px dashed var(--border)", color: "var(--text-3)", cursor: "pointer",
              fontSize: "13px", fontWeight: 600,
            }}>+ Add Team Member</button>
          )}
        </div>
      </div>
    </>
  );
}
