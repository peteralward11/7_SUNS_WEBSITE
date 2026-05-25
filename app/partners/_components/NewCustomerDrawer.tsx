"use client";
import { useEffect, useState } from "react";

interface Form {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  preferred_date: string;
  notes: string;
}

const empty: Form = { full_name: "", email: "", phone: "", address: "", preferred_date: "", notes: "" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "13px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  backgroundColor: "var(--input-bg)",
  color: "var(--text)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "7.5pt",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--text-2)",
  textTransform: "uppercase",
  marginBottom: 5,
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: "#B44A2C", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: "11px", color: "#B44A2C", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

export default function NewCustomerDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (info: { email: string; full_name: string; address: string }) => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setForm(empty); setErrors({}); setApiError(null); }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set(key: keyof Form, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const next = { ...e }; delete next[key]; return next; });
  }

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.full_name.trim()) e.full_name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      const res = await fetch("/api/partners/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          notes: form.notes.trim() || null,
          preferred_date: form.preferred_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Something went wrong"); return; }
      onCreated({
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        address: form.address.trim(),
      });
    } catch {
      setApiError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

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
            <p style={{ fontSize: "10px", color: "var(--text-3)", margin: 0, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Customer Panel</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)" }}>New Customer</p>
          </div>
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
              Customer Panel
            </p>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              New Customer
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: "var(--hover)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              fontSize: "18px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Contact section */}
          <div>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
              Contact
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full Name" required error={errors.full_name}>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => set("full_name", e.target.value)}
                  placeholder="Jane Smith"
                  style={{ ...inputStyle, borderColor: errors.full_name ? "#B44A2C" : undefined }}
                />
              </Field>
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="jane@example.com"
                  style={{ ...inputStyle, borderColor: errors.email ? "#B44A2C" : undefined }}
                />
              </Field>
              <Field label="Phone" required error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+1 (416) 555-0100"
                  style={{ ...inputStyle, borderColor: errors.phone ? "#B44A2C" : undefined }}
                />
              </Field>
              <Field label="Address" required error={errors.address}>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => set("address", e.target.value)}
                  placeholder="123 Main St, Toronto, ON M5V 1A1"
                  style={{ ...inputStyle, borderColor: errors.address ? "#B44A2C" : undefined }}
                />
              </Field>
            </div>
          </div>

          {/* Job Details section */}
          <div>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
              Job Details <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", fontSize: "11px" }}>— optional</span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Preferred Date">
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={e => set("preferred_date", e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Any details about the job…"
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                />
              </Field>
            </div>
          </div>

          {apiError && (
            <p style={{ fontSize: "13px", color: "#B44A2C", margin: 0, padding: "10px 14px", backgroundColor: "rgba(180,74,44,0.06)", border: "1px solid rgba(180,74,44,0.2)", borderRadius: 6 }}>
              {apiError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--hairline)",
          display: "flex",
          gap: 10,
          backgroundColor: "var(--surface)",
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "9px 16px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              backgroundColor: "transparent",
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              flex: 2,
              padding: "9px 16px",
              border: "none",
              borderRadius: 6,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              backgroundColor: saving ? "var(--border)" : "#111111",
              color: saving ? "var(--text-3)" : "#ffffff",
              cursor: saving ? "default" : "pointer",
              transition: "background-color 150ms ease",
            }}
          >
            {saving ? "Saving…" : "Create Customer"}
          </button>
        </div>
      </div>
    </>
  );
}
