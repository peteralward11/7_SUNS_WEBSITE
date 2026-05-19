"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBooking } from "@/lib/BookingContext";

/* ─── Constants ─────────────────────────────────────────── */

const APPLIANCE_TYPES = [
  "Refrigerator", "Stove / Range", "Dishwasher", "OTR Microwave", "Range Hood",
  "Washer", "Dryer", "Wall Oven", "Cooktop", "Wine Fridge / Beverage Center", "Other",
];

const BRANDS = [
  "Samsung", "LG", "Fisher & Paykel", "Whirlpool", "Bosch",
  "Miele", "GE / GE Profile", "KitchenAid", "Other",
];

const STEPS = ["Your Info", "Details", "Schedule"];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/* ─── Types ─────────────────────────────────────────────── */

interface ApplianceEntry {
  type: string;
  type_other: string;
  brand: string;
  brand_other: string;
}

function emptyEntry(): ApplianceEntry {
  return { type: "", type_other: "", brand: "", brand_other: "" };
}

interface FormState {
  full_name: string; email: string; phone: string;
  project_type: "residential" | "builder";
  company_name: string;
  appliance_count: string;
  appliance_entries: ApplianceEntry[];
  address: string;
  unit_count: string;
  installation: boolean | null;
  removal: boolean | null;
  elevator: boolean | null;
  stair_carry: boolean | null;
  preferred_date: string;
  access_notes: string;
  notes: string;
}

const INITIAL: FormState = {
  full_name: "", email: "", phone: "",
  project_type: "residential",
  company_name: "",
  appliance_count: "",
  appliance_entries: [],
  address: "",
  unit_count: "",
  installation: null,
  removal: null,
  elevator: null,
  stair_carry: null,
  preferred_date: "",
  access_notes: "",
  notes: "",
};

type Setter = <K extends keyof FormState>(k: K, v: FormState[K]) => void;
type Errors = Partial<Record<keyof FormState | "appliance_entries", string>>;
type EntryError = { type?: string; brand?: string };

interface SP { form: FormState; set: Setter; errors: Errors; }
interface Step2Props extends SP {
  updateEntry: (i: number, field: keyof ApplianceEntry, value: string) => void;
  handleCountChange: (v: string) => void;
  entryErrors: EntryError[];
}

/* ─── Design tokens ─────────────────────────────────────── */
const T = {
  navy:    "#0C1420",
  midnav:  "#1B3A5C",
  green:   "#6BBF44",
  muted:   "#94A3B8",
  subtle:  "#64748B",
  border:  "rgba(12,20,32,0.12)",
  surface: "#F8F9FB",
};

/* ─── Address autocomplete ───────────────────────────────── */

function AddressInput({ value, onChange, error, placeholder = "123 Main St, Toronto, ON M5A 1B2" }: {
  value: string; onChange: (v: string) => void; error?: string; placeholder?: string;
}) {
  const [sugs, setSugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setMounted(true); }, []);

  function repos() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  async function search(q: string) {
    if (q.trim().length < 3) { setSugs([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const list: string[] = await res.json();
      repos();
      setSugs(list);
      setOpen(list.length > 0);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  function handleChange(v: string) {
    onChange(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 350);
  }

  function pick(s: string) { onChange(s); setOpen(false); setSugs([]); }

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest("[data-addr-wrap]") && !t.closest("[data-addr-dropdown]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const dropdown = open && sugs.length > 0 ? (
    <div
      data-addr-dropdown
      style={{
        position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 99999,
        backgroundColor: "#FFFFFF", borderRadius: 12,
        boxShadow: "0 8px 32px rgba(12,20,32,0.16), 0 2px 8px rgba(12,20,32,0.08)",
        border: "1.5px solid rgba(12,20,32,0.1)", overflow: "hidden",
      }}
    >
      {sugs.map((s, i) => (
        <button
          key={i} type="button" onMouseDown={() => pick(s)}
          style={{
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
  ) : null;

  return (
    <div data-addr-wrap style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
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
      {mounted && createPortal(dropdown, document.body)}
    </div>
  );
}

/* ─── Input helpers ─────────────────────────────────────── */

function inputStyle(error?: string): React.CSSProperties {
  return {
    width: "100%", padding: "11px 13px", borderRadius: 9,
    border: `1px solid ${error ? "#F87171" : T.border}`,
    backgroundColor: T.surface, color: T.navy, fontSize: 14,
    fontFamily: "var(--font-sans)", outline: "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxSizing: "border-box",
  };
}

function applyFocus(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  error?: string
) {
  e.currentTarget.style.borderColor = error ? "#F87171" : T.green;
  e.currentTarget.style.boxShadow = `0 0 0 2px ${error ? "rgba(248,113,113,0.12)" : "rgba(107,191,68,0.14)"}`;
}

function applyBlur(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  error?: string
) {
  e.currentTarget.style.borderColor = error ? "#F87171" : T.border;
  e.currentTarget.style.boxShadow = "none";
}

/* ─── Shared field UI ───────────────────────────────────── */

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: T.subtle, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
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

/* ─── Dropdown helper ───────────────────────────────────── */

function SelectInput({ value, onChange, options, placeholder, error }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; error?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle(error),
          paddingRight: 36,
          cursor: "pointer",
          color: value ? T.navy : T.muted,
          appearance: "none",
          WebkitAppearance: "none",
        } as React.CSSProperties}
        onFocus={e => applyFocus(e, error)}
        onBlur={e => applyBlur(e, error)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.muted }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 3.5L5.5 7.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

/* ─── Toggle row ─────────────────────────────────────────── */

function ToggleRow({ label, hint, value, onChange, error }: {
  label: string; hint?: string; value: boolean | null; onChange: (v: boolean) => void; error?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "3px 0" }}>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: T.midnav, lineHeight: 1.4 }}>{label}</p>
        {hint && <p style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{hint}</p>}
        {error && <p style={{ fontSize: 12, color: "#F87171", marginTop: 2 }}>{error}</p>}
      </div>
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {([true, false] as const).map(v => {
          const active = value === v;
          return (
            <button key={String(v)} type="button" onClick={() => onChange(v)} style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              border: `1px solid ${active ? T.green : T.border}`,
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

/* ─── Per-appliance entry card ───────────────────────────── */

function ApplianceEntryCard({ entry, index, onChange, entryError }: {
  entry: ApplianceEntry;
  index: number;
  onChange: (field: keyof ApplianceEntry, value: string) => void;
  entryError?: EntryError;
}) {
  const hasError = !!(entryError?.type || entryError?.brand);
  return (
    <div style={{
      borderRadius: 10, padding: "14px 16px", backgroundColor: "#FFFFFF",
      border: `1px solid ${hasError ? "#F87171" : "rgba(12,20,32,0.1)"}`,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: T.muted,
        letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12,
      }}>
        Appliance {index + 1}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label required>Type</Label>
          <SelectInput
            value={entry.type}
            onChange={v => onChange("type", v)}
            options={APPLIANCE_TYPES}
            placeholder="Select type"
            error={entryError?.type}
          />
          {entry.type === "Other" && (
            <div style={{ marginTop: 6 }}>
              <TextInput
                value={entry.type_other}
                onChange={v => onChange("type_other", v)}
                placeholder="Describe appliance…"
              />
            </div>
          )}
        </div>
        <div>
          <Label required>Brand</Label>
          <SelectInput
            value={entry.brand}
            onChange={v => onChange("brand", v)}
            options={BRANDS}
            placeholder="Select brand"
            error={entryError?.brand}
          />
          {entry.brand === "Other" && (
            <div style={{ marginTop: 6 }}>
              <TextInput
                value={entry.brand_other}
                onChange={v => onChange("brand_other", v)}
                placeholder="Enter brand name…"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Service toggles (shared) ──────────────────────────── */

function ServiceToggles({ form, set, errors }: SP) {
  const divider = <hr style={{ border: "none", borderTop: "1px solid rgba(12,20,32,0.06)", margin: 0 }} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ToggleRow label="Installation Required?" value={form.installation} onChange={v => set("installation", v)} error={errors.installation} />
      {divider}
      <ToggleRow label="Old Unit Removal?" value={form.removal} onChange={v => set("removal", v)} error={errors.removal} />
      {divider}
      <ToggleRow label="Elevator Booking Required?" hint="Condo / highrise with elevator access needed" value={form.elevator} onChange={v => set("elevator", v)} error={errors.elevator} />
      {divider}
      <ToggleRow label="Stair Carry Required?" hint="Delivery requires carrying up or down stairs" value={form.stair_carry} onChange={v => set("stair_carry", v)} error={errors.stair_carry} />
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────── */

function Step1({ form, set, errors }: SP) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Label>Project Type</Label>
        <div style={{ display: "flex", gap: 6 }}>
          {(["residential", "builder"] as const).map(t => {
            const active = form.project_type === t;
            return (
              <button key={t} type="button" onClick={() => set("project_type", t)} style={{
                flex: 1, padding: "11px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                border: `1px solid ${active ? T.midnav : T.border}`,
                backgroundColor: active ? T.midnav : T.surface,
                color: active ? "#FFFFFF" : T.subtle,
                transition: "all 0.18s",
              }}>
                {t === "residential" ? "Residential" : "Builder / Commercial"}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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

      {form.project_type === "builder" && (
        <div>
          <Label required>Company / Builder Name</Label>
          <TextInput value={form.company_name} onChange={v => set("company_name", v)} placeholder="Greenpark Homes" error={errors.company_name} />
          <ErrMsg msg={errors.company_name} />
        </div>
      )}
    </div>
  );
}

/* ─── Step 2 — Residential ───────────────────────────────── */

function Step2Residential({ form, set, errors, updateEntry, handleCountChange, entryErrors }: Step2Props) {
  const count = parseInt(form.appliance_count);
  const showEntries = !isNaN(count) && count >= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Label required>How many appliances are being delivered?</Label>
        <TextInput
          type="number"
          value={form.appliance_count}
          onChange={handleCountChange}
          placeholder="e.g. 3"
          error={errors.appliance_count}
          min="1"
        />
        <ErrMsg msg={errors.appliance_count} />
      </div>

      {showEntries && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: -2 }}>
            Select the type and brand for each appliance.
          </p>
          {form.appliance_entries.map((entry, i) => (
            <ApplianceEntryCard
              key={i}
              entry={entry}
              index={i}
              onChange={(field, value) => updateEntry(i, field, value)}
              entryError={entryErrors[i]}
            />
          ))}
          <ErrMsg msg={errors.appliance_entries} />
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid rgba(12,20,32,0.07)", margin: 0 }} />
      <ServiceToggles form={form} set={set} errors={errors} />
    </div>
  );
}

/* ─── Step 2 — Builder ───────────────────────────────────── */

function Step2Builder({ form, set, errors, updateEntry, handleCountChange, entryErrors }: Step2Props) {
  const count = parseInt(form.appliance_count);
  const showEntries = !isNaN(count) && count >= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Label required>Site / Project Address</Label>
        <AddressInput value={form.address} onChange={v => set("address", v)} error={errors.address} placeholder="123 Site Rd, Vaughan, ON" />
        <ErrMsg msg={errors.address} />
      </div>

      <div>
        <Label required>Number of Units</Label>
        <TextInput type="number" value={form.unit_count} onChange={v => set("unit_count", v)} placeholder="e.g. 50" error={errors.unit_count} min="1" />
        <ErrMsg msg={errors.unit_count} />
      </div>

      <div>
        <Label required>How many appliances per unit?</Label>
        <TextInput
          type="number"
          value={form.appliance_count}
          onChange={handleCountChange}
          placeholder="e.g. 3"
          error={errors.appliance_count}
          min="1"
        />
        <ErrMsg msg={errors.appliance_count} />
      </div>

      {showEntries && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: -2 }}>
            Select the type and brand for each appliance per unit.
          </p>
          {form.appliance_entries.map((entry, i) => (
            <ApplianceEntryCard
              key={i}
              entry={entry}
              index={i}
              onChange={(field, value) => updateEntry(i, field, value)}
              entryError={entryErrors[i]}
            />
          ))}
          <ErrMsg msg={errors.appliance_entries} />
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid rgba(12,20,32,0.07)", margin: 0 }} />
      <ServiceToggles form={form} set={set} errors={errors} />
    </div>
  );
}

/* ─── Summary card ───────────────────────────────────────── */

function SummaryCard({ form, isBuilder }: { form: FormState; isBuilder: boolean }) {
  const applianceStr = form.appliance_entries.length
    ? form.appliance_entries.map((e, i) => {
        const type = e.type === "Other" ? (e.type_other || "Other") : e.type;
        const brand = e.brand === "Other" ? (e.brand_other || "Other") : e.brand;
        return brand ? `${type} (${brand})` : type;
      }).join(", ")
    : "—";

  const rows: Array<[string, string]> = isBuilder
    ? [
        ["Name", form.full_name || "—"],
        ["Company", form.company_name || "—"],
        ["Site Address", form.address || "—"],
        ["Units", form.unit_count || "—"],
        ["Appliances / Unit", applianceStr],
        ["Date", form.preferred_date || "—"],
      ]
    : [
        ["Name", form.full_name || "—"],
        ["Appliances", applianceStr],
        ["Address", form.address || "—"],
        ["Date", form.preferred_date || "—"],
      ];

  return (
    <div style={{
      borderRadius: 10, padding: "14px 16px",
      backgroundColor: T.surface, border: "1px solid rgba(12,20,32,0.08)",
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
        Booking Summary
      </p>
      {rows.map(([l, v]) => (
        <div key={l} style={{ display: "flex", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 500, minWidth: 96, flexShrink: 0 }}>{l}</span>
          <span style={{ fontSize: 11.5, color: T.navy, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Step 3 — Residential ───────────────────────────────── */

function Step3Residential({ form, set, errors }: SP) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Label required>Delivery Address</Label>
        <AddressInput value={form.address} onChange={v => set("address", v)} error={errors.address} />
        <ErrMsg msg={errors.address} />
      </div>

      <div>
        <Label>Special Access Notes</Label>
        <TextInput value={form.access_notes} onChange={v => set("access_notes", v)} placeholder="Narrow hallway, gated community, parking restrictions…" />
      </div>

      <div>
        <Label required>Preferred Date</Label>
        <TextInput type="date" value={form.preferred_date} onChange={v => set("preferred_date", v)} min={tomorrow()} error={errors.preferred_date} />
        <ErrMsg msg={errors.preferred_date} />
      </div>

      <div>
        <Label>Additional Notes</Label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Anything else we should know…"
          rows={2}
          style={{ ...inputStyle(), resize: "none", lineHeight: 1.6 }}
          onFocus={e => applyFocus(e)}
          onBlur={e => applyBlur(e)}
        />
      </div>

      <SummaryCard form={form} isBuilder={false} />
    </div>
  );
}

/* ─── Step 3 — Builder ───────────────────────────────────── */

function Step3Builder({ form, set, errors }: SP) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Label required>Preferred Start Date</Label>
        <TextInput type="date" value={form.preferred_date} onChange={v => set("preferred_date", v)} min={tomorrow()} error={errors.preferred_date} />
        <ErrMsg msg={errors.preferred_date} />
      </div>

      <div>
        <Label>Special Access Notes</Label>
        <TextInput value={form.access_notes} onChange={v => set("access_notes", v)} placeholder="Site access code, elevator availability, parking on-site…" />
      </div>

      <div>
        <Label>Project Notes</Label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Project timeline, phased delivery, special requirements…"
          rows={2}
          style={{ ...inputStyle(), resize: "none", lineHeight: 1.6 }}
          onFocus={e => applyFocus(e)}
          onBlur={e => applyBlur(e)}
        />
      </div>

      <SummaryCard form={form} isBuilder={true} />
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
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

/* ─── Main modal ─────────────────────────────────────────── */

export default function BookingModal() {
  const { isOpen, close } = useBooking();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"next" | "back">("next");
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [entryErrors, setEntryErrors] = useState<EntryError[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBuilder = form.project_type === "builder";

  const stepHeading = step === 1
    ? "Your Information"
    : step === 2
      ? isBuilder ? "Project Details" : "Appliance Details"
      : isBuilder ? "Schedule" : "Address & Schedule";

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    if (isOpen) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => { setStep(1); setForm(INITIAL); setStatus("idle"); setErrors({}); setEntryErrors([]); }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  }

  function handleCountChange(v: string) {
    setField("appliance_count", v);
    const n = parseInt(v);
    if (!isNaN(n) && n >= 1 && n <= 20) {
      setForm(f => {
        const current = f.appliance_entries;
        const entries = n > current.length
          ? [...current, ...Array(n - current.length).fill(null).map(emptyEntry)]
          : current.slice(0, n);
        return { ...f, appliance_count: v, appliance_entries: entries };
      });
      setEntryErrors(errs => {
        if (n < errs.length) return errs.slice(0, n);
        if (n > errs.length) return [...errs, ...Array(n - errs.length).fill({})];
        return errs;
      });
    } else {
      setForm(f => ({ ...f, appliance_count: v, appliance_entries: [] }));
      setEntryErrors([]);
    }
  }

  function updateEntry(i: number, field: keyof ApplianceEntry, value: string) {
    setForm(f => {
      const entries = [...f.appliance_entries];
      entries[i] = { ...entries[i], [field]: value };
      return { ...f, appliance_entries: entries };
    });
    setEntryErrors(errs => {
      const updated = [...errs];
      if (!updated[i]) updated[i] = {};
      updated[i] = { ...updated[i], [field]: undefined };
      return updated;
    });
  }

  function validate(s: number): boolean {
    const errs: Errors = {};
    if (s === 1) {
      if (!form.full_name.trim()) errs.full_name = "Required";
      if (!form.email.trim()) errs.email = "Required";
      if (!form.phone.trim()) errs.phone = "Required";
      if (isBuilder && !form.company_name.trim()) errs.company_name = "Required";
    }
    if (s === 2) {
      if (!form.appliance_count || parseInt(form.appliance_count) < 1) {
        errs.appliance_count = "Required";
      } else {
        const eErrs: EntryError[] = form.appliance_entries.map(entry => {
          const e: EntryError = {};
          if (!entry.type) e.type = "Required";
          if (!entry.brand) e.brand = "Required";
          return e;
        });
        setEntryErrors(eErrs);
        if (eErrs.some(e => e.type || e.brand)) {
          errs.appliance_entries = "Please complete all appliance details above";
        }
      }
      if (form.installation === null) errs.installation = "Please select Yes or No";
      if (form.removal === null) errs.removal = "Please select Yes or No";
      if (form.elevator === null) errs.elevator = "Please select Yes or No";
      if (form.stair_carry === null) errs.stair_carry = "Please select Yes or No";
      if (isBuilder) {
        if (!form.address.trim()) errs.address = "Required";
        if (!form.unit_count || parseInt(form.unit_count) < 1) errs.unit_count = "Required";
      }
    }
    if (s === 3) {
      if (!form.preferred_date) errs.preferred_date = "Required";
      if (!isBuilder && !form.address.trim()) errs.address = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validate(step)) { setDir("next"); setStep(s => Math.min(s + 1, 3)); }
  }
  function back() { setDir("back"); setStep(s => Math.max(s - 1, 1)); }

  async function submit() {
    if (!validate(3)) return;
    setStatus("submitting");
    try {
      const serializedAppliances = form.appliance_entries.map(e => {
        const type = e.type === "Other" ? (e.type_other.trim() || "Other appliance") : e.type;
        const brand = e.brand === "Other" ? (e.brand_other.trim() || "Other brand") : e.brand;
        return `${type} (${brand})`;
      });
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          project_type: form.project_type,
          company_name: form.company_name || null,
          appliance_count: form.appliance_count ? parseInt(form.appliance_count) : null,
          address: form.address,
          unit_count: form.unit_count ? parseInt(form.unit_count) : null,
          appliances: serializedAppliances,
          installation: form.installation ?? false,
          removal: form.removal ?? false,
          elevator: form.elevator ?? false,
          stair_carry: form.stair_carry ?? false,
          preferred_date: form.preferred_date,
          access_notes: form.access_notes || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch { setStatus("error"); }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight { from { transform: translateX(22px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInLeft  { from { transform: translateX(-22px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .step-enter-next { animation: slideInRight 0.22s cubic-bezier(0.16,1,0.3,1) both; }
        .step-enter-back { animation: slideInLeft  0.22s cubic-bezier(0.16,1,0.3,1) both; }
      `}} />

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          backgroundColor: "rgba(12,20,32,0.65)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          transition: "opacity 0.25s",
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={e => { if (e.target === e.currentTarget) close(); }}
      >
        <div style={{
          position: "relative", display: "flex", flexDirection: "column",
          width: "100%", maxWidth: 620, height: "min(92vh, 780px)",
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(12,20,32,0.18), 0 4px 16px rgba(12,20,32,0.08)",
          transition: "transform 0.32s cubic-bezier(0.34,1.15,0.64,1), opacity 0.25s",
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
        }}>

          {/* Top bar */}
          <div style={{ flexShrink: 0, borderBottom: "1px solid rgba(12,20,32,0.08)", backgroundColor: "#FFFFFF" }}>
            <div style={{ height: 3, backgroundColor: T.green }} />
            <div style={{ padding: "16px 28px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.green, lineHeight: 1 }}>
                  7 Suns Delivery
                </p>
                <button onClick={close} aria-label="Close" style={{
                  width: 28, height: 28, borderRadius: "50%", border: "none",
                  backgroundColor: T.surface, color: T.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "background-color 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(12,20,32,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = T.navy; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = T.surface; (e.currentTarget as HTMLButtonElement).style.color = T.muted; }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <Progress step={step} />
            </div>
          </div>

          {/* Scrollable body */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px 8px" }}>
            {status === "success" ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", textAlign: "center", height: "100%", padding: "16px 0",
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
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.navy, letterSpacing: "-0.02em", fontFamily: "var(--font-sans)", marginBottom: 10 }}>
                  Booking request received.
                </h2>
                <p style={{ fontSize: 14, color: T.muted, maxWidth: 290, lineHeight: 1.7, marginBottom: 26 }}>
                  We&apos;ll confirm your delivery date within one business day. Check your email for a confirmation.
                </p>
                <button onClick={close} style={{
                  padding: "11px 30px", borderRadius: 10, border: "none",
                  backgroundColor: T.green, color: T.navy, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "var(--font-sans)", transition: "transform 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div key={step} className={dir === "next" ? "step-enter-next" : "step-enter-back"}>
                  <h2 style={{
                    fontSize: 21, fontWeight: 700, color: T.navy,
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "-0.01em", marginBottom: 22, lineHeight: 1.2,
                  }}>
                    {stepHeading}
                  </h2>

                  {step === 1 && <Step1 form={form} set={setField} errors={errors} />}
                  {step === 2 && !isBuilder && (
                    <Step2Residential
                      form={form} set={setField} errors={errors}
                      updateEntry={updateEntry}
                      handleCountChange={handleCountChange}
                      entryErrors={entryErrors}
                    />
                  )}
                  {step === 2 && isBuilder && (
                    <Step2Builder
                      form={form} set={setField} errors={errors}
                      updateEntry={updateEntry}
                      handleCountChange={handleCountChange}
                      entryErrors={entryErrors}
                    />
                  )}
                  {step === 3 && !isBuilder && <Step3Residential form={form} set={setField} errors={errors} />}
                  {step === 3 && isBuilder && <Step3Builder form={form} set={setField} errors={errors} />}
                </div>

                {status === "error" && (
                  <p style={{ marginTop: 18, fontSize: 13, color: "#F87171", textAlign: "center" }}>
                    Something went wrong. Try again or email{" "}
                    <a href="mailto:info@7suns.ca" style={{ color: T.green }}>info@7suns.ca</a>.
                  </p>
                )}
                <div style={{ height: 20 }} />
              </>
            )}
          </div>

          {/* Footer */}
          {status !== "success" && (
            <div style={{
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 28px 16px",
              borderTop: "1px solid rgba(12,20,32,0.08)",
              backgroundColor: "#FAFBFC",
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
                <p style={{ fontSize: 12, color: T.muted, fontFamily: "var(--font-sans)" }}>Takes under 2 minutes</p>
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
      </div>
    </>
  );
}
