"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Icons ─────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const CheckSmall = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckTile = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8L6.5 11.5L13 4.5" stroke="#4A8C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Appliances ─────────────────────────────────────── */
const APPLIANCES = [
  "Fridge / Refrigerator",
  "Built-In Refrigerator",
  "Stove / Range",
  "Built-In Wall Oven",
  "Double Wall Oven",
  "Cooktop",
  "Dishwasher",
  "Microwave / OTR",
  "Range Hood",
  "Washer",
  "Dryer",
  "Wine Cooler",
  "Other",
];

/* ─── Types ──────────────────────────────────────────── */
type Step = 1 | 2 | 3;
type Status = "idle" | "submitting" | "success" | "error";

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  project_type: "residential" | "builder";
  address: string;
  appliances: string[];
  installation: boolean | null;
  removal: boolean | null;
  preferred_date: string;
  alternate_date: string;
  notes: string;
}

const empty: FormData = {
  full_name: "", email: "", phone: "", project_type: "residential",
  address: "", appliances: [], installation: null, removal: null,
  preferred_date: "", alternate_date: "", notes: "",
};

/* ─── Shared field styles ────────────────────────────── */
const fieldBase: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px",
  fontWeight: 400, color: "#1B3A5C", backgroundColor: "#FFFFFF",
  border: "1px solid rgba(12,20,32,0.14)", borderRadius: "10px",
  padding: "12px 14px", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
const focusStyle: React.CSSProperties = {
  borderColor: "#6BBF44", boxShadow: "0 0 0 3px rgba(107,191,68,0.12)",
};

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 600, color: "#1B3A5C", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
      {children}
    </label>
  );
}

/* ─── Progress indicator ─────────────────────────────── */
function Progress({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Your Info" },
    { n: 2, label: "Job Details" },
    { n: 3, label: "Schedule" },
  ];
  return (
    <div className="flex items-center justify-center mb-8 gap-0">
      {steps.map(({ n, label }, i) => {
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  backgroundColor: done || active ? "#6BBF44" : "#FFFFFF",
                  border: done || active ? "none" : "1.5px solid rgba(12,20,32,0.2)",
                  transition: "background-color 0.3s",
                }}
              >
                {done
                  ? <CheckSmall />
                  : <span style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 700, color: active ? "#0C1420" : "#94A3B8" }}>{n}</span>
                }
              </div>
              <span style={{ fontFamily: "var(--font-outfit)", fontSize: "10px", fontWeight: active ? 600 : 400, color: active ? "#1B3A5C" : "#94A3B8", whiteSpace: "nowrap", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 48, height: 1.5, backgroundColor: step > n + 1 || (step === n + 1) ? "#6BBF44" : "rgba(12,20,32,0.12)", margin: "0 6px", marginBottom: "18px", transition: "background-color 0.3s", flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Toggle pills ───────────────────────────────────── */
function TogglePill<T extends string | boolean>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: active ? 600 : 400,
              padding: "9px 20px", borderRadius: "8px", cursor: "pointer", border: "1px solid",
              borderColor: active ? "#6BBF44" : "rgba(12,20,32,0.14)",
              backgroundColor: active ? "#6BBF44" : "#FFFFFF",
              color: active ? "#0C1420" : "#64748B",
              transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Appliance checkbox tile ────────────────────────── */
function ApplianceTile({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: checked ? 500 : 400,
        padding: "11px 12px", borderRadius: "10px",
        border: checked ? "1.5px solid #6BBF44" : "1px solid rgba(12,20,32,0.12)",
        backgroundColor: checked ? "rgba(107,191,68,0.06)" : "#FFFFFF",
        color: checked ? "#1B3A5C" : "#64748B",
        display: "flex", alignItems: "center", gap: "8px",
        transition: "all 0.18s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: checked ? "#6BBF44" : "transparent",
          border: checked ? "none" : "1.5px solid rgba(12,20,32,0.2)",
          transition: "all 0.18s",
        }}
      >
        {checked && <CheckTile />}
      </span>
      {label}
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function BookNowPage() {
  useScrollReveal();

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(empty);
  const [status, setStatus] = useState<Status>("idle");
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "appliances_min" | "installation_req" | "removal_req", string>>>({});

  const fs = (name: string): React.CSSProperties => focused === name ? focusStyle : {};

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setData((d) => ({ ...d, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key as keyof typeof n]; return n; });
  }

  function toggleAppliance(label: string) {
    setData((d) => ({
      ...d,
      appliances: d.appliances.includes(label)
        ? d.appliances.filter((a) => a !== label)
        : [...d.appliances, label],
    }));
    setErrors((e) => { const n = { ...e }; delete n.appliances_min; return n; });
  }

  /* ── Per-step validation ── */
  function validateStep1() {
    const e: typeof errors = {};
    if (!data.full_name.trim()) e.full_name = "Required";
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Valid email required";
    if (!data.phone.trim()) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function validateStep2() {
    const e: typeof errors = {};
    if (!data.address.trim()) e.address = "Required";
    if (data.appliances.length === 0) e.appliances_min = "Select at least one appliance";
    if (data.installation === null) e.installation_req = "Please select Yes or No";
    if (data.removal === null) e.removal_req = "Please select Yes or No";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s < 3 ? (s + 1) as Step : s));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function prevStep() {
    setStep((s) => (s > 1 ? (s - 1) as Step : s));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Tomorrow's date for min ── */
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.preferred_date) { setErrors({ preferred_date: "Required" }); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const errStyle: React.CSSProperties = { fontFamily: "var(--font-outfit)", fontSize: "12px", color: "#DC2626", marginTop: "5px", display: "block" };

  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#F4F5F9", paddingTop: "88px" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(12,20,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(12,20,32,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="max-w-2xl" data-reveal>
            <p className="text-xs font-semibold uppercase mb-6 flex items-center gap-3" style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Book a Delivery
            </p>
            <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(1.9rem, 8vw, 5rem)", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.04em", color: "#1B3A5C", marginBottom: "20px" }}>
              Let&apos;s Get Your<br />
              Delivery{" "}
              <span style={{ color: "#6BBF44" }}>Scheduled.</span>
            </h1>
            <p style={{ fontFamily: "var(--font-outfit)", fontSize: "17px", fontWeight: 300, color: "#4A5568", lineHeight: 1.7, maxWidth: "460px" }}>
              Fill out the form below and our team will confirm your delivery window within one business day. Takes under two minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ══ FORM ══════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-3xl mx-auto px-6">

          {/* Success state */}
          {status === "success" ? (
            <div className="flex flex-col items-center text-center py-20" data-reveal>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(107,191,68,0.12)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12L9 17L20 6" stroke="#4A8C28" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "#1B3A5C", marginBottom: "14px" }}>
                Booking request received.
              </h2>
              <p style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 300, color: "#64748B", lineHeight: 1.7, maxWidth: "400px", marginBottom: "32px" }}>
                We&apos;ll confirm your delivery date within one business day. Check your email for a confirmation.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: "#6BBF44", color: "#0C1420", fontFamily: "var(--font-outfit)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(107,191,68,0.25)", transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Back to Home <ArrowRight />
              </Link>
            </div>
          ) : (
            <div
              className="rounded-2xl p-8 sm:p-10"
              style={{ backgroundColor: "#F8F9FB", border: "1px solid rgba(12,20,32,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              data-reveal
            >
              <Progress step={step} />

              {/* ── Step 1: Your Info ── */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#1B3A5C", marginBottom: "6px" }}>Your Info</h2>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 300, color: "#94A3B8", marginBottom: "28px", lineHeight: 1.6 }}>We&apos;ll use these details to confirm your booking and stay in touch.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <input id="full_name" type="text" value={data.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Jane Smith" style={{ ...fieldBase, ...fs("full_name") }} onFocus={() => setFocused("full_name")} onBlur={() => setFocused(null)} />
                      {errors.full_name && <span style={errStyle}>{errors.full_name}</span>}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <input id="email" type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" style={{ ...fieldBase, ...fs("email") }} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
                      {errors.email && <span style={errStyle}>{errors.email}</span>}
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="phone">Phone Number</Label>
                    <input id="phone" type="tel" value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="(416) 555-0100" style={{ ...fieldBase, ...fs("phone") }} onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)} />
                    {errors.phone && <span style={errStyle}>{errors.phone}</span>}
                  </div>

                  <div className="mb-8">
                    <Label>Project Type</Label>
                    <TogglePill
                      options={[{ label: "Residential", value: "residential" as const }, { label: "Builder / Commercial", value: "builder" as const }]}
                      value={data.project_type}
                      onChange={(v) => set("project_type", v)}
                    />
                  </div>

                  <button type="button" onClick={nextStep} className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: "#6BBF44", color: "#0C1420", fontFamily: "var(--font-outfit)", border: "none", cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(107,191,68,0.25)", transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                    Next: Job Details <ArrowRight />
                  </button>
                </div>
              )}

              {/* ── Step 2: Job Details ── */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#1B3A5C", marginBottom: "6px" }}>Job Details</h2>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 300, color: "#94A3B8", marginBottom: "28px", lineHeight: 1.6 }}>Tell us about the delivery location and what appliances we&apos;re bringing in.</p>

                  <div className="mb-5">
                    <Label htmlFor="address">Delivery Address</Label>
                    <input id="address" type="text" value={data.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Toronto, ON M1A 1A1" style={{ ...fieldBase, ...fs("address") }} onFocus={() => setFocused("address")} onBlur={() => setFocused(null)} />
                    {errors.address && <span style={errStyle}>{errors.address}</span>}
                  </div>

                  <div className="mb-6">
                    <Label>Appliances <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "#94A3B8", fontSize: "11px" }}>(select all that apply)</span></Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {APPLIANCES.map((a) => (
                        <ApplianceTile key={a} label={a} checked={data.appliances.includes(a)} onToggle={() => toggleAppliance(a)} />
                      ))}
                    </div>
                    {errors.appliances_min && <span style={errStyle}>{errors.appliances_min}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <Label>Installation Needed?</Label>
                      <TogglePill options={[{ label: "Yes", value: true }, { label: "No", value: false }]} value={data.installation} onChange={(v) => { set("installation", v); setErrors(e => { const n = { ...e }; delete n.installation_req; return n; }); }} />
                      {errors.installation_req && <span style={errStyle}>{errors.installation_req}</span>}
                    </div>
                    <div>
                      <Label>Old Unit Removal?</Label>
                      <TogglePill options={[{ label: "Yes", value: true }, { label: "No", value: false }]} value={data.removal} onChange={(v) => { set("removal", v); setErrors(e => { const n = { ...e }; delete n.removal_req; return n; }); }} />
                      {errors.removal_req && <span style={errStyle}>{errors.removal_req}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={prevStep} className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm" style={{ border: "1px solid rgba(12,20,32,0.14)", color: "#64748B", fontFamily: "var(--font-outfit)", backgroundColor: "#FFFFFF", cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6BBF44"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,20,32,0.14)"; }}>
                      <ArrowLeft /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: "#6BBF44", color: "#0C1420", fontFamily: "var(--font-outfit)", border: "none", cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(107,191,68,0.25)", transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                      Next: Schedule <ArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Schedule ── */}
              {step === 3 && (
                <form onSubmit={handleSubmit}>
                  <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#1B3A5C", marginBottom: "6px" }}>Schedule</h2>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 300, color: "#94A3B8", marginBottom: "28px", lineHeight: 1.6 }}>Pick your preferred delivery date. We&apos;ll confirm availability within one business day.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <Label htmlFor="preferred_date">Preferred Date</Label>
                      <input id="preferred_date" type="date" value={data.preferred_date} min={minDate} onChange={e => set("preferred_date", e.target.value)} style={{ ...fieldBase, ...fs("preferred_date") }} onFocus={() => setFocused("preferred_date")} onBlur={() => setFocused(null)} />
                      {errors.preferred_date && <span style={errStyle}>{errors.preferred_date}</span>}
                    </div>
                    <div>
                      <Label htmlFor="alternate_date">Alternate Date <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "#94A3B8" }}>(optional)</span></Label>
                      <input id="alternate_date" type="date" value={data.alternate_date} min={minDate} onChange={e => set("alternate_date", e.target.value)} style={{ ...fieldBase, ...fs("alternate_date") }} onFocus={() => setFocused("alternate_date")} onBlur={() => setFocused(null)} />
                    </div>
                  </div>

                  <div className="mb-7">
                    <Label htmlFor="notes">Additional Notes <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "#94A3B8" }}>(optional)</span></Label>
                    <textarea id="notes" value={data.notes} onChange={e => set("notes", e.target.value)} rows={4} placeholder="Gate code, floor number, special instructions…" style={{ ...fieldBase, ...fs("notes"), resize: "vertical", minHeight: "100px", lineHeight: 1.65 }} onFocus={() => setFocused("notes")} onBlur={() => setFocused(null)} />
                  </div>

                  {/* Booking summary strip */}
                  {data.appliances.length > 0 && (
                    <div className="mb-7 px-5 py-4 rounded-xl" style={{ backgroundColor: "rgba(107,191,68,0.06)", border: "1px solid rgba(107,191,68,0.16)" }}>
                      <p style={{ fontFamily: "var(--font-outfit)", fontSize: "11px", fontWeight: 600, color: "#4A8C28", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>Booking Summary</p>
                      <p style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: 0 }}>
                        <strong>{data.appliances.join(", ")}</strong>
                        {" · "}
                        {data.address}
                        {data.installation ? " · Installation included" : ""}
                        {data.removal ? " · Old unit removal" : ""}
                      </p>
                    </div>
                  )}

                  {status === "error" && (
                    <p className="mb-5 text-sm" style={{ fontFamily: "var(--font-outfit)", color: "#DC2626" }}>
                      Something went wrong. Please try again or email us at{" "}
                      <a href="mailto:info@7Suns.ca" style={{ textDecoration: "underline" }}>info@7Suns.ca</a>.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={prevStep} className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm" style={{ border: "1px solid rgba(12,20,32,0.14)", color: "#64748B", fontFamily: "var(--font-outfit)", backgroundColor: "#FFFFFF", cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6BBF44"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,20,32,0.14)"; }}>
                      <ArrowLeft /> Back
                    </button>
                    <button type="submit" disabled={status === "submitting"} className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: status === "submitting" ? "rgba(107,191,68,0.6)" : "#6BBF44", color: "#0C1420", fontFamily: "var(--font-outfit)", border: "none", cursor: status === "submitting" ? "not-allowed" : "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(107,191,68,0.25)", transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), background-color 0.2s" }} onMouseEnter={e => { if (status !== "submitting") (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                      {status === "submitting" ? "Submitting…" : <>Confirm Booking <ArrowRight /></>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
