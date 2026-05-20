"use client";

import { Fragment, useEffect, useRef, useState } from "react";

/* ─── Constants ─────────────────────────────────────────── */

const FP_APPLIANCE_TYPES = [
  "Refrigerator / French Door Fridge",
  "CoolDrawer (Refrigerator Drawer)",
  "Built-In Refrigerator",
  "DishDrawer / Dishwasher",
  "Washing Machine",
  "Dryer / Heat Pump Dryer",
  "Wall Oven",
  "Cooktop / Induction Hob",
  "Freestanding Range / Cooker",
  "Range Hood",
  "Microwave / OTR",
  "Other",
];

const STEPS = ["Your Info", "Appliances", "Delivery", "Schedule"];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/* ─── Types ─────────────────────────────────────────────── */

interface ApplianceEntry { type: string; type_other?: string; }

interface FormState {
  full_name: string; email: string; phone: string; fp_order_number: string;
  project_type: "residential" | "builder";
  company_name: string; site_contact_name: string; site_contact_phone: string;
  appliance_count: number;
  appliance_entries: ApplianceEntry[];
  address: string; suite_number: string; floor_number: string; unit_count: number;
  installation: boolean | null; removal: boolean | null;
  elevator: boolean | null; stair_carry: boolean | null;
  access_notes: string;
  preferred_date: string; alternate_date: string;
  time_window: "morning" | "afternoon" | "flexible" | null;
  notes: string;
}

const INITIAL: FormState = {
  full_name: "", email: "", phone: "", fp_order_number: "",
  project_type: "residential",
  company_name: "", site_contact_name: "", site_contact_phone: "",
  appliance_count: 1, appliance_entries: [{ type: "" }],
  address: "", suite_number: "", floor_number: "", unit_count: 1,
  installation: null, removal: null, elevator: null, stair_carry: null,
  access_notes: "",
  preferred_date: "", alternate_date: "",
  time_window: null, notes: "",
};

type Setter = <K extends keyof FormState>(k: K, v: FormState[K]) => void;
type Errors = Record<string, string | undefined>;
interface SP { form: FormState; set: Setter; errors: Errors; }
interface S2P extends SP { updateAppliance: (i: number, e: ApplianceEntry) => void; }

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
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
          onFocus={e => { applyFocus(e, error); }}
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
          position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%", zIndex: 9999,
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

/* ─── Select input ──────────────────────────────────────── */

function SelectInput({ value, onChange, children, error }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; error?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle(error), appearance: "none" as React.CSSProperties["appearance"], paddingRight: 36, cursor: "pointer" }}
        onFocus={e => {
          e.currentTarget.style.borderColor = error ? "#F87171" : T.green;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(248,113,113,0.12)" : "rgba(107,191,68,0.12)"}`;
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = error ? "#F87171" : T.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {children}
      </select>
      <svg style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.muted }} width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─── Number input ──────────────────────────────────────── */

function NumberInput({ value, onChange, min = 1, max = 20, error }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; error?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => {
        const raw = parseInt(e.target.value, 10);
        if (!isNaN(raw)) onChange(Math.max(min, Math.min(max, raw)));
      }}
      style={{ ...inputStyle(error), maxWidth: 140 }}
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

/* ─── Time window toggle ─────────────────────────────────── */

function TimeWindowToggle({ value, onChange }: {
  value: "morning" | "afternoon" | "flexible" | null;
  onChange: (v: "morning" | "afternoon" | "flexible") => void;
}) {
  const options: { value: "morning" | "afternoon" | "flexible"; label: string; sub: string }[] = [
    { value: "morning",   label: "Morning",   sub: "8am – 12pm" },
    { value: "afternoon", label: "Afternoon", sub: "12pm – 5pm" },
    { value: "flexible",  label: "Flexible",  sub: "Either works" },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)} style={{
            flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${active ? T.green : T.border}`,
            backgroundColor: active ? "rgba(107,191,68,0.08)" : "#FFFFFF",
            fontFamily: "var(--font-sans)", transition: "all 0.15s", textAlign: "center",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: active ? "#1B6B00" : T.navy, margin: 0, lineHeight: 1.3 }}>{opt.label}</p>
            <p style={{ fontSize: 11, color: active ? "#1B6B00" : T.muted, margin: "3px 0 0", lineHeight: 1 }}>{opt.sub}</p>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Appliance card ─────────────────────────────────────── */

function ApplianceCard({ index, entry, onChange, error }: {
  index: number; entry: ApplianceEntry;
  onChange: (entry: ApplianceEntry) => void; error?: string;
}) {
  return (
    <div style={{ padding: "16px 18px", border: `1.5px solid ${error && !entry.type ? "#F87171" : T.border}`, borderRadius: 12, backgroundColor: "#FFFFFF" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: T.subtle, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
        Appliance {index + 1}
      </p>
      <div>
        <Label required>Appliance Type</Label>
        <SelectInput value={entry.type} onChange={v => onChange({ ...entry, type: v })} error={error && !entry.type ? error : undefined}>
          <option value="">Select type…</option>
          {FP_APPLIANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </SelectInput>
        {error && !entry.type && <ErrMsg msg={error} />}
      </div>
      {entry.type === "Other" && (
        <div style={{ marginTop: 12 }}>
          <Label>Please describe</Label>
          <TextInput value={entry.type_other ?? ""} onChange={v => onChange({ ...entry, type_other: v })} placeholder="e.g. built-in wine cabinet" />
        </div>
      )}
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
                margin: "13px 6px 0",
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

/* ─── Step 1: Your Information ───────────────────────────── */

function Step1({ form, set, errors }: SP) {
  const isBuilder = form.project_type === "builder";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {isBuilder && (
        <>
          <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: T.subtle, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            Builder Details
          </p>
          <div>
            <Label required>Company Name</Label>
            <TextInput value={form.company_name} onChange={v => set("company_name", v)} placeholder="ABC Developments Inc." error={errors.company_name} />
            <ErrMsg msg={errors.company_name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Site Contact Name</Label>
              <TextInput value={form.site_contact_name} onChange={v => set("site_contact_name", v)} placeholder="Mike Johnson" error={errors.site_contact_name} />
              <ErrMsg msg={errors.site_contact_name} />
            </div>
            <div>
              <Label required>Site Contact Phone</Label>
              <TextInput type="tel" value={form.site_contact_phone} onChange={v => set("site_contact_phone", v)} placeholder="(416) 555-0200" error={errors.site_contact_phone} />
              <ErrMsg msg={errors.site_contact_phone} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Step 2: Appliance Details ──────────────────────────── */

function Step2({ form, set, errors, updateAppliance }: S2P) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Label required>How many appliances?</Label>
        <p style={{ fontSize: 12, color: T.muted, marginTop: -4, marginBottom: 10 }}>Enter a number between 1 and 20</p>
        <NumberInput value={form.appliance_count} onChange={v => set("appliance_count", v)} min={1} max={20} error={errors.appliance_count} />
        <ErrMsg msg={errors.appliance_count} />
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.subtle, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Appliance Types
        </p>
        {form.appliance_entries.map((entry, i) => (
          <ApplianceCard
            key={i}
            index={i}
            entry={entry}
            onChange={e => updateAppliance(i, e)}
            error={errors[`appliance_${i}`]}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Step 3: Delivery & Logistics ──────────────────────── */

function Step3({ form, set, errors }: SP) {
  const isBuilder = form.project_type === "builder";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <Label required>Delivery Address</Label>
        <AddressInput value={form.address} onChange={v => set("address", v)} error={errors.address} />
        <ErrMsg msg={errors.address} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Suite / Unit #</Label>
          <TextInput value={form.suite_number} onChange={v => set("suite_number", v)} placeholder="e.g. 4B or 204" />
        </div>
        <div>
          <Label>Floor #</Label>
          <TextInput value={form.floor_number} onChange={v => set("floor_number", v)} placeholder="e.g. 3" />
        </div>
      </div>

      {isBuilder && (
        <div>
          <Label required>Number of Units</Label>
          <p style={{ fontSize: 12, color: T.muted, marginTop: -4, marginBottom: 10 }}>How many units are receiving appliances?</p>
          <NumberInput value={form.unit_count} onChange={v => set("unit_count", v)} min={1} max={9999} error={errors.unit_count} />
          <ErrMsg msg={errors.unit_count} />
        </div>
      )}

      <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ToggleRow label="Installation Required?" value={form.installation} onChange={v => set("installation", v)} error={errors.installation} />
        <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />
        <ToggleRow label="Old Unit Removal?" value={form.removal} onChange={v => set("removal", v)} error={errors.removal} />
        <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />
        <ToggleRow label="Elevator Booking Required?" hint="Reserve building elevator access for delivery day" value={form.elevator} onChange={v => set("elevator", v)} error={errors.elevator} />
        <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />
        <ToggleRow label="Stair Carry Required?" hint="Delivery requires carrying up or down stairs" value={form.stair_carry} onChange={v => set("stair_carry", v)} error={errors.stair_carry} />
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: 0 }} />

      <div>
        <Label>Building Access Notes</Label>
        <TextInput value={form.access_notes} onChange={v => set("access_notes", v)} placeholder="Gate code, concierge instructions, parking details…" />
      </div>
    </div>
  );
}

/* ─── Step 4: Schedule ───────────────────────────────────── */

function Step4({ form, set, errors }: SP) {
  const min = tomorrow();
  const applianceList = form.appliance_entries
    .filter(e => e.type)
    .map(e => e.type === "Other" && e.type_other ? `Other: ${e.type_other}` : e.type)
    .join(", ");
  const addressDisplay = [
    form.address,
    form.suite_number && `Suite ${form.suite_number}`,
    form.floor_number && `Floor ${form.floor_number}`,
  ].filter(Boolean).join(", ");
  const serviceFlags = [
    form.installation && "Installation",
    form.removal && "Old Unit Removal",
    form.elevator && "Elevator",
    form.stair_carry && "Stair Carry",
  ].filter(Boolean).join(", ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <Label>Preferred Time Window</Label>
        <TimeWindowToggle value={form.time_window} onChange={v => set("time_window", v)} />
      </div>

      <div>
        <Label>Additional Notes</Label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Any other details we should know…"
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
        {([
          ["Name", form.full_name || "—"],
          ["F&P Order #", form.fp_order_number || "—"],
          ["Address", addressDisplay || "—"],
          ["Appliances", applianceList || "—"],
          ...(serviceFlags ? [["Services", serviceFlags]] : []),
          ...(form.project_type === "builder" && form.company_name ? [["Company", form.company_name]] : []),
        ] as [string, string][]).map(([l, v]) => (
          <div key={l} style={{ display: "flex", gap: 14, marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 500, minWidth: 90, flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 12, color: T.navy, fontWeight: 500, wordBreak: "break-word" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────── */

function FPModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Reset form after close animation finishes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep(1); setForm(INITIAL); setStatus("idle"); setErrors({});
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Scroll body to top on step change
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => {
      const updated: FormState = { ...f, [k]: v };
      if (k === "appliance_count") {
        const count = Number(v);
        if (!isNaN(count) && count >= 1) {
          const entries = [...f.appliance_entries];
          while (entries.length < count) entries.push({ type: "" });
          while (entries.length > count) entries.pop();
          updated.appliance_entries = entries;
        }
      }
      return updated;
    });
    setErrors(e => ({ ...e, [k]: undefined }));
  }

  function updateAppliance(index: number, entry: ApplianceEntry) {
    setForm(f => {
      const entries = [...f.appliance_entries];
      entries[index] = entry;
      return { ...f, appliance_entries: entries };
    });
    setErrors(e => ({ ...e, [`appliance_${index}`]: undefined }));
  }

  function validate(s: number): boolean {
    const errs: Errors = {};
    if (s === 1) {
      if (!form.full_name.trim()) errs.full_name = "Required";
      if (!form.email.trim()) errs.email = "Required";
      if (!form.phone.trim()) errs.phone = "Required";
      if (!form.fp_order_number.trim()) errs.fp_order_number = "Required";
      if (form.project_type === "builder") {
        if (!form.company_name.trim()) errs.company_name = "Required";
        if (!form.site_contact_name.trim()) errs.site_contact_name = "Required";
        if (!form.site_contact_phone.trim()) errs.site_contact_phone = "Required";
      }
    }
    if (s === 2) {
      if (!form.appliance_count || form.appliance_count < 1) errs.appliance_count = "Enter a number between 1 and 20";
      form.appliance_entries.forEach((entry, i) => {
        if (!entry.type) errs[`appliance_${i}`] = "Please select a type";
      });
    }
    if (s === 3) {
      if (!form.address.trim()) errs.address = "Required";
      if (form.installation === null) errs.installation = "Please select Yes or No";
      if (form.removal === null) errs.removal = "Please select Yes or No";
      if (form.elevator === null) errs.elevator = "Please select Yes or No";
      if (form.stair_carry === null) errs.stair_carry = "Please select Yes or No";
      if (form.project_type === "builder" && !form.unit_count) errs.unit_count = "Required";
    }
    if (s === 4 && !form.preferred_date) errs.preferred_date = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep(s => Math.min(s + 1, 4)); }
  function back() { setStep(s => Math.max(s - 1, 1)); }

  async function submit() {
    if (!validate(4)) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/book/fp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name, email: form.email, phone: form.phone,
          fp_order_number: form.fp_order_number, project_type: form.project_type,
          company_name: form.company_name || null,
          site_contact_name: form.site_contact_name || null,
          site_contact_phone: form.site_contact_phone || null,
          address: form.address,
          suite_number: form.suite_number || null,
          floor_number: form.floor_number || null,
          unit_count: form.unit_count || null,
          appliance_entries: form.appliance_entries,
          installation: form.installation ?? false,
          removal: form.removal ?? false,
          elevator: form.elevator ?? false,
          stair_carry: form.stair_carry ?? false,
          access_notes: form.access_notes || null,
          preferred_date: form.preferred_date,
          alternate_date: form.alternate_date || null,
          time_window: form.time_window || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch { setStatus("error"); }
  }

  const headings = ["Your Information", "Appliance Details", "Delivery & Logistics", "Schedule"];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          backgroundColor: "rgba(12,20,32,0.65)",
          backdropFilter: "blur(16px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Modal container */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 201,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: "100%", maxWidth: 620,
            maxHeight: "92vh",
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(12,20,32,0.28), 0 4px 16px rgba(12,20,32,0.12)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
            transition: "opacity 0.32s cubic-bezier(0.16,1,0.3,1), transform 0.32s cubic-bezier(0.16,1,0.3,1)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top bar */}
          <div style={{ borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ height: 3, backgroundColor: T.green }} />
            <div style={{ padding: "16px clamp(16px, 4vw, 28px) 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, color: T.midnav }}>
                  Fisher &amp; Paykel × 7 Suns Delivery
                </p>
                <Progress step={step} />
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: `1.5px solid ${T.border}`, backgroundColor: "#FFFFFF",
                  cursor: "pointer", flexShrink: 0, marginTop: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surface)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke={T.subtle} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "24px clamp(16px, 4vw, 28px) 8px" }}>
            {status === "success" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 16px 48px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  backgroundColor: "rgba(107,191,68,0.1)", border: "1.5px solid rgba(107,191,68,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
                }}>
                  <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                    <path d="M2 10L8.5 17L24 2" stroke={T.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.midnav, letterSpacing: "-0.02em", marginBottom: 10, fontFamily: "var(--font-sans)" }}>
                  Booking request received.
                </h2>
                <p style={{ fontSize: 14, color: T.muted, maxWidth: 320, lineHeight: 1.7, marginBottom: 24 }}>
                  We&apos;ll confirm your Fisher &amp; Paykel delivery date within one business day. Check your email for a confirmation.
                </p>
                <button onClick={onClose} style={{
                  padding: "10px 28px", borderRadius: 10, border: "none",
                  backgroundColor: T.green, color: T.navy,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.midnav, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", marginBottom: 24, lineHeight: 1.2 }}>
                  {headings[step - 1]}
                </h2>
                {step === 1 && <Step1 form={form} set={setField} errors={errors} />}
                {step === 2 && <Step2 form={form} set={setField} errors={errors} updateAppliance={updateAppliance} />}
                {step === 3 && <Step3 form={form} set={setField} errors={errors} />}
                {step === 4 && <Step4 form={form} set={setField} errors={errors} />}
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
              padding: "14px clamp(16px, 4vw, 28px) 20px",
              borderTop: `1px solid ${T.border}`,
              backgroundColor: T.surface,
              flexShrink: 0,
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
              {step < 4 ? (
                <button onClick={next} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 10,
                  border: "none", backgroundColor: T.green, color: T.navy,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "transform 0.15s, filter 0.15s",
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
      </div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

function BookBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "15px 36px", borderRadius: 10, border: "none",
        backgroundColor: T.green, color: T.navy,
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "transform 0.18s, filter 0.18s",
        boxShadow: "0 4px 20px rgba(107,191,68,0.35)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.07)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
    >
      Book Your Delivery
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4.5 2l5 4.5-5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function FisherPaykelPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const open = () => setModalOpen(true);

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        minHeight: "88vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#0C1420",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/fisher-main.png" alt="" aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(10,16,28,0.82) 0%, rgba(10,16,28,0.55) 50%, rgba(10,16,28,0.32) 100%)",
          zIndex: 1,
        }} />
        <div style={{
          position: "relative", zIndex: 2, width: "100%", maxWidth: 780, margin: "0 auto",
          padding: "clamp(64px, 10vw, 120px) clamp(20px, 3vw, 40px)",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div
            className="inline-flex items-center gap-2 sm:gap-3.5 mb-7 px-4 sm:px-[22px] py-2 sm:py-[10px] rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(8px)" }}
          >
            <span className="text-[11px] sm:text-[13px] font-bold tracking-[0.06em] sm:tracking-[0.12em] uppercase whitespace-nowrap text-white">Fisher &amp; Paykel</span>
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: T.green }} />
            <span className="text-[11px] sm:text-[13px] font-bold tracking-[0.06em] sm:tracking-[0.12em] uppercase whitespace-nowrap" style={{ color: T.green }}>7 Suns Delivery</span>
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 6vw, 62px)", fontWeight: 700,
            color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.15,
            margin: "0 0 24px", fontFamily: "var(--font-sans)",
            textShadow: "0 2px 24px rgba(0,0,0,0.5)",
          }}>
            White-Glove Delivery &amp; Installation, Done Right
          </h1>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.82)", lineHeight: 1.8, maxWidth: 560, margin: "0 0 40px", textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}>
            Fisher &amp; Paykel has partnered with 7 Suns Delivery &amp; Logistics to bring expert, careful handling to every appliance delivery. Book below — we&apos;ll confirm within one business day.
          </p>

          <div style={{ marginBottom: "clamp(28px, 5vw, 48px)" }}>
            <BookBtn onClick={open} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: "🛡", text: "Licensed & Insured" },
              { icon: "📦", text: "White-Glove Delivery" },
              { icon: "🔧", text: "Professional Installation" },
              { icon: "📅", text: "Confirmed in 1 Business Day" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "8px 12px", borderRadius: 9999,
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500,
                backdropFilter: "blur(8px)",
              }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(40px, 7vw, 64px) 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.green, textAlign: "center", marginBottom: 10 }}>How It Works</p>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, color: T.midnav, letterSpacing: "-0.02em", textAlign: "center", marginBottom: "clamp(24px, 5vw, 48px)" }}>
            Here&apos;s What Happens Next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { num: "01", title: "Book Your Delivery", body: "Click the button, fill out the short form with your contact details, appliances, and preferred date. It takes under 2 minutes." },
              { num: "02", title: "We'll Be in Touch", body: "Within one business day, our team will contact you to confirm the date and time, and go over any details — access, elevator booking, removal, and more." },
              { num: "03", title: "White-Glove Delivery & Installation", body: "Our trained in-house crew arrives, delivers your Fisher & Paykel appliance with care, and completes full professional installation on the spot." },
            ].map(({ num, title, body }) => (
              <div key={num} style={{ padding: "28px 24px", backgroundColor: T.surface, borderRadius: 16, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: T.green, letterSpacing: "-0.02em", marginBottom: 14, lineHeight: 1 }}>{num}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.midnav, marginBottom: 10, lineHeight: 1.4 }}>{title}</p>
                <p style={{ fontSize: 14, color: T.subtle, lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "clamp(48px, 8vw, 80px) 24px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>

          {/* Centered header */}
          <div style={{ textAlign: "center", maxWidth: 580, margin: "0 auto clamp(36px, 6vw, 56px)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.green, marginBottom: 12 }}>What We Offer</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 700, color: T.midnav, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 16 }}>
              More Than Just a Delivery Service
            </h2>
            <p style={{ fontSize: 15, color: T.subtle, lineHeight: 1.75, margin: 0 }}>
              Ontario&apos;s trusted appliance delivery and installation specialist. Our trained in-house team — never outsourced — handles every job from start to finish.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Hero card — White-Glove Delivery */}
            <div className="md:col-span-7" style={{
              backgroundColor: T.navy, borderRadius: 20,
              padding: "clamp(28px, 4vw, 40px)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              minHeight: 260,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(107,191,68,0.14)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="5" width="13" height="11" rx="2" stroke={T.green} strokeWidth="1.6" />
                  <path d="M14 8h3.5L20 12v4h-6V8z" stroke={T.green} strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="5.5" cy="17.5" r="1.8" stroke={T.green} strokeWidth="1.4" />
                  <circle cx="16.5" cy="17.5" r="1.8" stroke={T.green} strokeWidth="1.4" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.green, marginBottom: 10 }}>Signature Service</p>
                <h3 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
                  White-Glove Delivery
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.58)", lineHeight: 1.75, margin: 0, maxWidth: 360 }}>
                  Careful handling, protective floor coverings, and full unboxing — your Fisher &amp; Paykel arrives exactly as it left the factory.
                </p>
              </div>
            </div>

            {/* Professional Installation */}
            <div className="md:col-span-5" style={{ backgroundColor: T.surface, borderRadius: 20, padding: "clamp(24px, 3.5vw, 36px)", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(107,191,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13.5 2a4.5 4.5 0 0 1 1.06 4.88L18 10.3 10.3 18l-3.42-3.44A4.5 4.5 0 0 1 2 13.5a4.5 4.5 0 0 1 5.56-4.38L10 6.7" stroke={T.midnav} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="13.5" cy="6.5" r="1.2" fill={T.green} />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.midnav, letterSpacing: "-0.02em", marginBottom: 10 }}>Professional Installation</h3>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>
                  Proper hookup, precision levelling, and full function testing before we leave. Every time.
                </p>
              </div>
            </div>

            {/* Old Unit Removal */}
            <div className="md:col-span-4" style={{ backgroundColor: T.surface, borderRadius: 20, padding: "clamp(24px, 3vw, 32px)", border: `1px solid ${T.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: "rgba(107,191,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 5h12M7 5V3h4v2M6 5v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5" stroke={T.midnav} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 8v4M10 8v4" stroke={T.green} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.midnav, letterSpacing: "-0.01em", marginBottom: 8 }}>Old Unit Removal</h3>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, margin: 0 }}>We haul away your old appliance — no extra calls, no extra hassle.</p>
            </div>

            {/* Elevator & Building */}
            <div className="md:col-span-4" style={{ backgroundColor: T.surface, borderRadius: 20, padding: "clamp(24px, 3vw, 32px)", border: `1px solid ${T.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: "rgba(107,191,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="2" width="12" height="14" rx="2" stroke={T.midnav} strokeWidth="1.5" />
                  <path d="M7 9h4M9 7v4" stroke={T.green} strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M6.5 14.5h5" stroke={T.midnav} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.midnav, letterSpacing: "-0.01em", marginBottom: 8 }}>Elevator & Building Coordination</h3>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, margin: 0 }}>We arrange elevator bookings and coordinate directly with building management.</p>
            </div>

            {/* Same-Day Confirmation */}
            <div className="md:col-span-4" style={{ backgroundColor: T.surface, borderRadius: 20, padding: "clamp(24px, 3vw, 32px)", border: `1px solid ${T.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: "rgba(107,191,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="12" rx="2" stroke={T.midnav} strokeWidth="1.5" />
                  <path d="M6 2v2M12 2v2M2 8h14" stroke={T.midnav} strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6 12l2 2 4-4" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.midnav, letterSpacing: "-0.01em", marginBottom: 8 }}>Confirmed in 1 Business Day</h3>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, margin: 0 }}>Our team reviews every booking and confirms your appointment the same day.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: T.midnav, padding: "clamp(48px, 8vw, 80px) 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.green, marginBottom: 16 }}>
          Ready to Book?
        </p>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 16 }}>
          Schedule Your Fisher &amp; Paykel Delivery
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: 460, margin: "0 auto 36px" }}>
          Our team will confirm your appointment within one business day.
        </p>
        <BookBtn onClick={open} />
      </section>

      <FPModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
