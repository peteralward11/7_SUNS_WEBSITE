"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditCustomerForm({
  email,
  initialName,
  initialPhone,
  initialAddress,
}: {
  email: string;
  initialName: string;
  initialPhone: string;
  initialAddress: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/partners/customers/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name, phone, address }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    fontSize: "13px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    backgroundColor: "var(--input-bg)",
    color: "var(--text)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  if (!editing) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{name || email}</h1>
          <button
            onClick={() => setEditing(true)}
            style={{ padding: "3px 10px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 6, fontSize: "11px", color: "var(--text-3)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Edit
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>{email}</p>
        {phone && <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "2px 0 0" }}>{phone}</p>}
        {address && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "2px 0 0" }}>{address}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Name</label>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Phone</label>
        <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-2)", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Address</label>
        <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "6px 16px", backgroundColor: "#111111", border: "none", borderRadius: 6, fontSize: "12px", fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setName(initialName); setPhone(initialPhone); setAddress(initialAddress); setEditing(false); }}
          style={{ padding: "6px 12px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 6, fontSize: "12px", color: "var(--text-3)", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
