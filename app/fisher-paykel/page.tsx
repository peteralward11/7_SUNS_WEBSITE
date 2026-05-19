"use client";

import { Fragment, useEffect, useRef, useState } from "react";

/* ─── Constants ─────────────────────────────────────────── */

const APPLIANCES = [
  "Fridge / Refrigerator", "Built-In Refrigerator", "Stove / Range",
  "Built-In Wall Oven", "Double Wall Oven", "Cooktop", "Dishwasher",
  "Microwave / OTR", "Range Hood", "Washer", "Dryer", "Wine Cooler", "Other",
];

const STEPS = ["Your Info", "Details", "Schedule"];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/* ─── Types ─────────────────────────────────────────────── */

interface FormState {
  full_name: string; email: string; phone: string; fp_order_number: string;
  project_type: "residential" | "builder";
  address: string; appliances: string[]; other_appliance: string;
  installation: boolean | null; removal: boolean | null; elevator: boolean | null;
  preferred_date: string; alternate_date: string; notes: string;
}

const INITIAL: FormState = {
  full_name: "", email: "", phone: "", fp_order_number: "",
  project_type: "residential",
  address: "", appliances: [], other_appliance: "",
  installation: null, removal: null, elevator: null,
  preferred_date: "", alternate_date: "", notes: "",
};

type Setter = <K extends keyof FormState>(k: K, v: FormState[K]) => void;
type Errors = Partial<Record<keyof FormState, string>>;
interface SP { form: FormState; set: Setter; errors: Errors; }
interface S2P extends SP { toggleAppliance: (n: string) => void; }

/* ─── Design tokens ─────────────────────────────────────── */
const T = {
  navy:    "#0C1420",
  midnav:  "#1B3A5C",
  green:   "#6BBF44",
  muted:   "#94A3B8",
  subtle:  "#64748B",
  border:  "#E4E9F0",
  surface: "#F8F9FB",
  input:   "#FFFFFF",
};

/* ─── Address autocomplete (Nominatim) ──────────────────── */

interface NomResult {
  address: {
    house_number?: string; road?: string;
    city?: string; town?: string; village?: string; municipality?: string;
    state?: string; postcode?: string;
  };
}

function fmt(r: NomResult): string {
  const a = r.address;
  const st = a.house_number && a.road ? `${a.house_number} ${a.road}` : (a.road ?? "");
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
  return [st, city, a.state, a.postcode].filter(Boolean).join(", ");
}

function AddressInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [sugs, setSugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function repos() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 5, left: r.left, width: r.width });
  }

  async function search(q: string) {
    if (q.trim().length < 3) { setSugs([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=ca&addressdetails=1&limit=6`;
      const res = await fetch(url, { headers: { "Accept-Language": "en", "User-Agent": "7SunsDelivery/1.0" } });
      const data: NomResult[] = await res.json();
      const list = [...new Set(data.map(fmt).filter(s => s.length > 4))].slice(0, 5);
      setSugs(list); setOpen(list.length > 0); repos();
    } catch { /* silent */ } finally { setLoading(false); }
  }

  function handleChange(v: string) {
    onChange(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 380);
  }

  function pick(s: string) { onChange(s); setOpen(false); setSugs([]); }

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-addr-wrap]")) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div data-addr-wrap style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="123 Main St, Toronto, ON M5A 1B2"
          autoComplete="off"
          style={{ ...inputStyle(error), paddingRight: 40 }}
          onFocus={e => { repos(); applyFocus(e, error); }}
          onBlur={e => applyBlur(e, error)}
        />
        <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }}>
          {loading ? (
            <svg className="animate-spin" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke={T.border} strokeWidth="2" />
              <path d="M7.5 2A5.5 5.5 0 0 1 13 7.5" stroke={T.green} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 .5C4.51.5 2.5 2.51 2.5 5c0 3.75 4.5 8.5 4.5 8.5S11.5 8.75 11.5 5C11.5 2.51 9.49.5 7 .5z" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <circle cx="7" cy="5" r="1.2" fill="currentColor" />
            </svg>
          )}
        </span>
      </div>

      {open && sugs.length > 0 && (
        <div style={{
          position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999,
          backgroundColor: "#FFFFFF", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(12,20,32,0.12), 0 2px 8px rgba(12,20,32,0.06)",
          border: `1.5px solid ${T.border}`, overflow: "hidden",
        }}>
          {sugs.map((s, i) => (
            <button key={i} type="button" onMouseDown={() => pick(s)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 14px", textAlign: "left",
              fontSize: 13, color: T.navy, fontWeight: 400,
              border: "none", backgroundColor: "transparent", cursor: "pointer",
              fontFamily: "var(--font-sans)",
              borderBottom: i < sugs.length - 1 ? `1px solid ${T.surface}` : "none",
              transition: "background-color 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surface)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: T.muted }}>
                <path d="M6 .5C3.79.5 2 2.29 2 4.5c0 3.37 4 7 4 7s4-3.63 4-7C10 2.29 8.21.5 6 .5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <circle cx="6" cy="4.5" r="1.1" fill="currentColor" />
              </svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Input helpers ─────────────────────────────────────── */

function inputStyle(error?: string): React.CSSProperties {
  return {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1.5px solid ${error ? "#F87171" : T.border}`,
    backgroundColor: T.input, color: T.navy, fontSize: 14,
    fontFamily: "var(--font-sans)", outline: "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxSizing: "border-box",
  };
}

function applyFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error?: string) {
  e.currentTarget.style.borderColor = error ? "#F87171" : T.green;
  e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(248,113,113,0.12)" : "rgba(107,191,68,0.12)"}`;
}

function applyBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error?: string) {
  e.currentTarget.style.borderColor = error ? "#F87171" : T.border;
  e.currentTarget.style.boxShadow = "none";
}

/* ─── Shared field UI ───────────────────────────────────── */

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: T.subtle, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
      {children}{required && <span style={{ color: "#F87171", marginLeft: 3 }}>*</span>}
    </p>
  );
}

function ErrMsg({ msg }: { msg?: string }) {
  return msg ? <p style={{ fontSize: 12, color: "#F87171", marginTop: 5 }}>{msg}</p> : null;
}

function TextInput({ value, onChange, type = "text", placeholder, error, min }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string; min?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} min={min}
      onChange={e => onChange(e.target.value)}
      style={inputStyle(error)}
      onFocus={e => applyFocus(e, error)}
      onBlur={e => applyBlur(e, error)}
    />
  );
}

/* ─── Toggle row ─────────────────────────────────────────── */

function ToggleRow({ label, hint, value, onChange, error }: {
  label: string; hint?: string; value: boolean | null; onChange: (v: boolean) => void; error?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "4px 0" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: T.navy, lineHeight: 1.4 }}>{label}</p>
        {hint && <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{hint}</p>}
        {error && <p style={{ fontSize: 12, color: "#F87171", marginTop: 3 }}>{error}</p>}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {([true, false] as const).map(v => {
          const active = value === v;
          return (
            <button key={String(v)} type="button" onClick={() => onChange(v)} style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              border: `1.5px solid ${active ? T.green : T.border}`,
              backgroundColor: active ? T.green : "#FFFFFF",
              color: active ? T.navy : T.subtle,
              transition: "all 0.15s",
            }}>
              {v ? "Yes" : "No"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Progress stepper ───────────────────────────────────── */

function Progress({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <Fragment key={idx}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: done ? T.green : active ? T.navy : "#FFFFFF",
                border: `2px solid ${done ? T.green : active ? T.navy : T.border}`,
                transition: "background-color 0.3s, border-color 0.3s",
              }}>
                {done ? (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#FFFFFF" : T.muted, lineHeight: 1 }}>{idx}</span>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                color: active ? T.navy : done ? T.green : T.muted,
                whiteSpace: "nowrap", transition: "color 0.3s",
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, borderRadius: 9999,
                margin: "13px 8px 0",
                backgroundColor: step > idx ? T.green : T.border,
                transition: "background-color 0.3s",
              }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────── */

function Step1({ form, set, errors }: SP) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Full Name</Label>
          <TextInput value={form.full_name} onChange={v => set("full_name", v)} placeholder="Jane Smith" error={errors.full_name} />
          <ErrMsg msg={errors.full_name} />
        </div>
        <div>
          <Label required>Phone</Label>
          <TextInput type="tel" value={form.phone} onChange={v => set("phone", v)} placeholder="(416) 555-0100" error={errors.phone} />
          <ErrMsg msg={errors.phone} />
        </div>
      </div>

      <div>
        <Label required>Email</Label>
        <TextInput type="email" value={form.email} onChange={v => set("email", v)} placeholder="jane@example.com" error={errors.email} />
        <ErrMsg msg={errors.email} />
      </div>

      <div>
        <Label required>Fisher &amp; Paykel Order Number</Label>
        <TextInput value={form.fp_order_number} onChange={v => set("fp_order_number", v)} placeholder="e.g. FP-123456" error={errors.fp_order_number} />
        <ErrMsg msg={errors.fp_order_number} />
      </div>

      <div>
        <Label>Project Type</Label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["residential", "builder"] as const).map(t => {
            const active = form.project_type === t;
            return (
              <button key={t} type="button" onClick={() => set("project_type", t)} style={{
                flex: 1, padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                border: `1.5px solid ${active ? T.green : T.border}`,
                backgroundColor: active ? "rgba(107,191,68,0.08)" : "#FFFFFF",
                color: active ? "#1B6B00" : T.subtle,
                transition: "all 0.15s",
              }}>
                {t === "residential" ? "Residential" : "Builder / Commercial"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2 ─────────────────────────────────────────────── */

function Step2({ form, set, errors, toggleAppliance }: S2P) {
  const hasOther = form.appliances.includes("Other");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <Label required>Delivery Address</Label>
        <AddressInput value={form.address} onChange={v => set("address", v)} error={errors.address} />
        <ErrMsg msg={errors.address} />
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />

      <div>
        <Label required>Appliances</Label>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 12, marginTop: -4 }}>Select all that apply</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {APPLIANCES.map(name => {
            const sel = form.appliances.includes(name);
            return (
              <button key={name} type="button" onClick={() => toggleAppliance(name)} style={{
                padding: "7px 14px", borderRadius: 9999, fontSize: 13, fontWeight: sel ? 600 : 500,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                border: `1.5px solid ${sel ? T.green : T.border}`,
                backgroundColor: sel ? "rgba(107,191,68,0.08)" : "#FFFFFF",
                color: sel ? "#1B6B00" : T.subtle,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!sel) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#B0BEC5"; b.style.color = T.navy; } }}
              onMouseLeave={e => { if (!sel) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = T.border; b.style.color = T.subtle; } }}
              >
                {name}
              </button>
            );
          })}
        </div>
        <ErrMsg msg={errors.appliances} />
        {hasOther && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={form.other_appliance} onChange={v => set("other_appliance", v)} placeholder="Please describe the appliance…" />
          </div>
        )}
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ToggleRow label="Installation Required?" value={form.installation} onChange={v => set("installation", v)} error={errors.installation} />
        <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />
        <ToggleRow label="Old Unit Removal?" value={form.removal} onChange={v => set("removal", v)} error={errors.removal} />
        <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />
        <ToggleRow label="Elevator Booking Required?" hint="Reserve building elevator access for delivery day" value={form.elevator} onChange={v => set("elevator", v)} error={errors.elevator} />
      </div>
    </div>
  );
}

/* ─── Step 3 ─────────────────────────────────────────────── */

function Step3({ form, set, errors }: SP) {
  const min = tomorrow();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Preferred Date</Label>
          <TextInput type="date" value={form.preferred_date} onChange={v => set("preferred_date", v)} min={min} error={errors.preferred_date} />
          <ErrMsg msg={errors.preferred_date} />
        </div>
        <div>
          <Label>Alternate Date</Label>
          <TextInput type="date" value={form.alternate_date} onChange={v => set("alternate_date", v)} min={min} />
          <p style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>Optional — if first choice isn&apos;t available</p>
        </div>
      </div>

      <div>
        <Label>Additional Notes</Label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Gate codes, parking, fragile items, timing preferences…"
          rows={3}
          style={{ ...inputStyle(), resize: "none", lineHeight: 1.6 }}
          onFocus={e => applyFocus(e)}
          onBlur={e => applyBlur(e)}
        />
      </div>

      {/* Summary */}
      <div style={{ borderRadius: 12, padding: "16px 18px", backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
          Booking Summary
        </p>
        {[
          ["Name", form.full_name || "—"],
          ["F&P Order #", form.fp_order_number || "—"],
          ["Address", form.address || "—"],
          ["Appliances", form.appliances.length
            ? form.appliances.map(a => a === "Other" && form.other_appliance ? `Other: ${form.other_appliance}` : a).join(", ")
            : "—"],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", gap: 14, marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 500, minWidth: 80, flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 12, color: T.navy, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function FisherPaykelPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step > 1) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  }

  function toggleAppliance(name: string) {
    setForm(f => ({ ...f, appliances: f.appliances.includes(name) ? f.appliances.filter(a => a !== name) : [...f.appliances, name] }));
    setErrors(e => ({ ...e, appliances: undefined }));
  }

  function validate(s: number): boolean {
    const errs: Errors = {};
    if (s === 1) {
      if (!form.full_name.trim()) errs.full_name = "Required";
      if (!form.email.trim()) errs.email = "Required";
      if (!form.phone.trim()) errs.phone = "Required";
      if (!form.fp_order_number.trim()) errs.fp_order_number = "Required";
    }
    if (s === 2) {
      if (!form.address.trim()) errs.address = "Required";
      if (!form.appliances.length) errs.appliances = "Select at least one appliance";
      if (form.installation === null) errs.installation = "Please select Yes or No";
      if (form.removal === null) errs.removal = "Please select Yes or No";
      if (form.elevator === null) errs.elevator = "Please select Yes or No";
    }
    if (s === 3 && !form.preferred_date) errs.preferred_date = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep(s => Math.min(s + 1, 3)); }
  function back() { setStep(s => Math.max(s - 1, 1)); }

  async function submit() {
    if (!validate(3)) return;
    setStatus("submitting");
    try {
      const appliances = form.appliances.includes("Other") && form.other_appliance.trim()
        ? [...form.appliances.filter(a => a !== "Other"), `Other: ${form.other_appliance.trim()}`]
        : form.appliances;
      const res = await fetch("/api/book/fp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name, email: form.email, phone: form.phone,
          fp_order_number: form.fp_order_number, project_type: form.project_type,
          address: form.address, appliances,
          installation: form.installation ?? false, removal: form.removal ?? false,
          elevator: form.elevator ?? false, preferred_date: form.preferred_date,
          alternate_date: form.alternate_date || null, notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch { setStatus("error"); }
  }

  const headings = ["Your Information", "Job Details", "Schedule"];

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{
        backgroundColor: "#FFFFFF",
        borderBottom: `1px solid ${T.border}`,
        padding: "80px 24px 72px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Co-brand eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.midnav }}>
              Fisher &amp; Paykel
            </span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: T.green, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.green }}>
              7 Suns Delivery
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 700,
            color: T.navy, letterSpacing: "-0.03em", lineHeight: 1.15,
            margin: "0 0 20px", fontFamily: "var(--font-sans)",
          }}>
            Schedule Your Appliance<br />Delivery &amp; Installation
          </h1>

          <p style={{
            fontSize: 16, color: T.subtle, lineHeight: 1.75,
            maxWidth: 480, margin: "0 auto",
          }}>
            You&apos;ve made a great choice. Book your Fisher &amp; Paykel delivery and installation in under 2 minutes — our team will confirm within one business day.
          </p>
        </div>
      </section>

      {/* ── Form section ── */}
      <section style={{ padding: "60px 24px 80px", backgroundColor: T.surface }}>
        <div ref={cardRef} style={{
          maxWidth: 620, margin: "0 auto",
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 4px 24px rgba(12,20,32,0.08), 0 1px 4px rgba(12,20,32,0.05)",
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}>

          {/* Card header */}
          <div style={{ borderBottom: `1px solid ${T.border}` }}>
            <div style={{ height: 3, backgroundColor: T.green }} />
            <div style={{ padding: "18px 28px 20px" }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", marginBottom: 18,
                color: T.midnav,
              }}>
                Fisher &amp; Paykel × 7 Suns Delivery
              </p>
              <Progress step={step} />
            </div>
          </div>

          {/* Form body */}
          <div style={{ padding: "28px 28px 8px" }}>
            {status === "success" ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                textAlign: "center", padding: "40px 16px 48px",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  backgroundColor: "rgba(107,191,68,0.1)", border: "1.5px solid rgba(107,191,68,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
                }}>
                  <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                    <path d="M2 10L8.5 17L24 2" stroke={T.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.navy, letterSpacing: "-0.02em", marginBottom: 10, fontFamily: "var(--font-sans)" }}>
                  Booking request received.
                </h2>
                <p style={{ fontSize: 14, color: T.muted, maxWidth: 320, lineHeight: 1.7, marginBottom: 0 }}>
                  We&apos;ll confirm your Fisher &amp; Paykel delivery date within one business day. Check your email for a confirmation.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{
                  fontSize: 22, fontWeight: 700, color: T.navy,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "-0.01em", marginBottom: 24, lineHeight: 1.2,
                }}>
                  {headings[step - 1]}
                </h2>

                {step === 1 && <Step1 form={form} set={setField} errors={errors} />}
                {step === 2 && <Step2 form={form} set={setField} errors={errors} toggleAppliance={toggleAppliance} />}
                {step === 3 && <Step3 form={form} set={setField} errors={errors} />}

                {status === "error" && (
                  <p style={{ marginTop: 18, fontSize: 13, color: "#F87171", textAlign: "center" }}>
                    Something went wrong. Try again or email{" "}
                    <a href="mailto:info@7Suns.ca" style={{ color: T.green }}>info@7Suns.ca</a>.
                  </p>
                )}
                <div style={{ height: 20 }} />
              </>
            )}
          </div>

          {/* Footer */}
          {status !== "success" && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 28px 20px",
              borderTop: `1px solid ${T.border}`,
              backgroundColor: T.surface,
            }}>
              {step > 1 ? (
                <button onClick={back} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 500, color: T.muted,
                  border: "none", backgroundColor: "transparent", cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = T.navy)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>
              ) : (
                <p style={{ fontSize: 12, color: T.muted }}>Takes under 2 minutes</p>
              )}

              {step < 3 ? (
                <button onClick={next} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 10,
                  border: "none", backgroundColor: T.green, color: T.navy,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "transform 0.15s, filter 0.15s",
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.filter = "brightness(1.06)"; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.filter = "none"; }}>
                  Continue
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M4.5 2l5 4.5-5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button onClick={submit} disabled={status === "submitting"} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  backgroundColor: T.green, color: T.navy,
                  fontSize: 14, fontWeight: 700,
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                  opacity: status === "submitting" ? 0.7 : 1,
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => { if (status !== "submitting") (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  {status === "submitting" ? "Submitting…" : "Confirm Booking →"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
