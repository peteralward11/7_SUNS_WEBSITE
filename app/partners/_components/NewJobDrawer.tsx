"use client";
import { useEffect, useState } from "react";

const APPLIANCE_TYPES = [
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

const TIME_WINDOWS = ["Morning (8am–12pm)", "Afternoon (12pm–4pm)", "Anytime"];

interface ApplianceEntry { type: string; other: string }

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

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
      {children}
    </p>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px",
        border: `1px solid ${checked ? "#111111" : "var(--border)"}`,
        borderRadius: 6,
        backgroundColor: checked ? "#111111" : "transparent",
        color: checked ? "#ffffff" : "var(--text-2)",
        fontSize: "12px", fontWeight: 600,
        cursor: "pointer", transition: "all 150ms ease",
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: 3,
        border: `1.5px solid ${checked ? "#ffffff" : "var(--border)"}`,
        backgroundColor: checked ? "#ffffff" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        fontSize: "10px", color: "#111111",
      }}>
        {checked && "✓"}
      </span>
      {label}
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (bookingId: string) => void;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
}

export default function NewJobDrawer({ open, onClose, onCreated, customerName = "", customerEmail = "", customerPhone = "", customerAddress = "" }: Props) {
  const [projectType, setProjectType] = useState<"residential" | "builder">("residential");
  const [fullName, setFullName]       = useState(customerName);
  const [email, setEmail]             = useState(customerEmail);
  const [phone, setPhone]             = useState(customerPhone);
  const [address, setAddress]         = useState(customerAddress);

  // Builder fields
  const [companyName, setCompanyName]           = useState("");
  const [siteContactName, setSiteContactName]   = useState("");
  const [siteContactPhone, setSiteContactPhone] = useState("");
  const [suiteNumber, setSuiteNumber]           = useState("");
  const [floorNumber, setFloorNumber]           = useState("");
  const [unitCount, setUnitCount]               = useState("");

  // Appliances
  const [appliances, setAppliances] = useState<ApplianceEntry[]>([{ type: APPLIANCE_TYPES[0], other: "" }]);

  // Services
  const [installation, setInstallation] = useState(false);
  const [removal, setRemoval]           = useState(false);
  const [elevator, setElevator]         = useState(false);
  const [stairCarry, setStairCarry]     = useState(false);

  // Schedule
  const [preferredDate, setPreferredDate] = useState("");
  const [alternateDate, setAlternateDate] = useState("");
  const [timeWindow, setTimeWindow]       = useState("");

  // Notes
  const [notes, setNotes]             = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [fpOrderNumber, setFpOrderNumber] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setProjectType("residential");
      setFullName(customerName);
      setEmail(customerEmail);
      setPhone(customerPhone);
      setAddress(customerAddress);
      setCompanyName(""); setSiteContactName(""); setSiteContactPhone("");
      setSuiteNumber(""); setFloorNumber(""); setUnitCount("");
      setAppliances([{ type: APPLIANCE_TYPES[0], other: "" }]);
      setInstallation(false); setRemoval(false); setElevator(false); setStairCarry(false);
      setPreferredDate(""); setAlternateDate(""); setTimeWindow("");
      setNotes(""); setAccessNotes(""); setFpOrderNumber("");
      setErrors({}); setApiError(null);
    }
  }, [open, customerName, customerEmail, customerPhone, customerAddress]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function addAppliance() {
    setAppliances(a => [...a, { type: APPLIANCE_TYPES[0], other: "" }]);
  }
  function removeAppliance(i: number) {
    setAppliances(a => a.filter((_, j) => j !== i));
  }
  function setApplianceType(i: number, type: string) {
    setAppliances(a => a.map((e, j) => j === i ? { ...e, type } : e));
  }
  function setApplianceOther(i: number, other: string) {
    setAppliances(a => a.map((e, j) => j === i ? { ...e, other } : e));
  }

  function clearError(key: string) {
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim())     e.fullName = "Name is required";
    if (!email.trim())        e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email";
    if (!phone.trim())        e.phone = "Phone is required";
    if (!address.trim())      e.address = "Address is required";
    if (!preferredDate)       e.preferredDate = "Preferred date is required";
    if (!appliances.some(a => a.type && a.type.trim())) e.appliances = "At least one appliance is required";
    if (projectType === "builder" && !companyName.trim()) e.companyName = "Company name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate() || saving) return;
    setSaving(true);
    setApiError(null);

    const applianceList = appliances
      .filter(a => a.type && a.type.trim())
      .map(a => a.type === "Other" && a.other.trim() ? `Other: ${a.other.trim()}` : a.type);

    try {
      const res = await fetch("/api/partners/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          project_type: projectType,
          company_name: companyName.trim() || null,
          site_contact_name: siteContactName.trim() || null,
          site_contact_phone: siteContactPhone.trim() || null,
          suite_number: suiteNumber.trim() || null,
          floor_number: floorNumber.trim() || null,
          unit_count: unitCount.trim() || null,
          appliances: applianceList,
          installation,
          removal,
          elevator,
          stair_carry: stairCarry,
          access_notes: accessNotes.trim() || null,
          preferred_date: preferredDate,
          alternate_date: alternateDate || null,
          time_window: timeWindow || null,
          notes: notes.trim() || null,
          fp_order_number: fpOrderNumber.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Something went wrong"); return; }
      onCreated(data.id);
    } catch {
      setApiError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 100 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(580px, 100vw)",
        backgroundColor: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        zIndex: 110,
        display: "flex",
        flexDirection: "column",
        animation: "fp-slide-in 220ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          backgroundColor: "var(--surface)", flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 4px" }}>
              New Job
            </p>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              {customerName || "Create Job"}
            </h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "var(--hover)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Project Type */}
          <div>
            <SectionTitle>Project Type</SectionTitle>
            <div style={{ display: "flex", gap: 8 }}>
              {(["residential", "builder"] as const).map(t => (
                <button key={t} type="button" onClick={() => setProjectType(t)} style={{
                  padding: "7px 16px", borderRadius: 6, fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "capitalize", cursor: "pointer", transition: "all 150ms ease",
                  border: `1px solid ${projectType === t ? "#111111" : "var(--border)"}`,
                  backgroundColor: projectType === t ? "#111111" : "transparent",
                  color: projectType === t ? "#ffffff" : "var(--text-2)",
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <SectionTitle>Contact</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full Name" required error={errors.fullName}>
                <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); clearError("fullName"); }} placeholder="Jane Smith" style={{ ...inputStyle, borderColor: errors.fullName ? "#B44A2C" : undefined }} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Email" required error={errors.email}>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); clearError("email"); }} placeholder="jane@example.com" style={{ ...inputStyle, borderColor: errors.email ? "#B44A2C" : undefined }} />
                </Field>
                <Field label="Phone" required error={errors.phone}>
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); clearError("phone"); }} placeholder="+1 (416) 555-0100" style={{ ...inputStyle, borderColor: errors.phone ? "#B44A2C" : undefined }} />
                </Field>
              </div>
              <Field label="Address" required error={errors.address}>
                <input type="text" value={address} onChange={e => { setAddress(e.target.value); clearError("address"); }} placeholder="123 Main St, Toronto, ON M5V 1A1" style={{ ...inputStyle, borderColor: errors.address ? "#B44A2C" : undefined }} />
              </Field>
              {projectType === "builder" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="Suite #">
                    <input type="text" value={suiteNumber} onChange={e => setSuiteNumber(e.target.value)} placeholder="4B" style={inputStyle} />
                  </Field>
                  <Field label="Floor #">
                    <input type="text" value={floorNumber} onChange={e => setFloorNumber(e.target.value)} placeholder="12" style={inputStyle} />
                  </Field>
                  <Field label="Unit Count">
                    <input type="number" min="1" value={unitCount} onChange={e => setUnitCount(e.target.value)} placeholder="1" style={inputStyle} />
                  </Field>
                </div>
              )}
            </div>
          </div>

          {/* Builder extras */}
          {projectType === "builder" && (
            <div>
              <SectionTitle>Builder Details</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Company Name" required error={errors.companyName}>
                  <input type="text" value={companyName} onChange={e => { setCompanyName(e.target.value); clearError("companyName"); }} placeholder="ABC Builders Inc." style={{ ...inputStyle, borderColor: errors.companyName ? "#B44A2C" : undefined }} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Site Contact Name">
                    <input type="text" value={siteContactName} onChange={e => setSiteContactName(e.target.value)} placeholder="Mike Jones" style={inputStyle} />
                  </Field>
                  <Field label="Site Contact Phone">
                    <input type="tel" value={siteContactPhone} onChange={e => setSiteContactPhone(e.target.value)} placeholder="+1 (416) 555-0199" style={inputStyle} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Appliances */}
          <div>
            <SectionTitle>Appliances</SectionTitle>
            {errors.appliances && <p style={{ fontSize: "11px", color: "#B44A2C", margin: "-10px 0 10px" }}>{errors.appliances}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appliances.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <select value={a.type} onChange={e => setApplianceType(i, e.target.value)} style={{ ...inputStyle }}>
                      {APPLIANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {a.type === "Other" && (
                      <input type="text" value={a.other} onChange={e => setApplianceOther(i, e.target.value)} placeholder="Describe the appliance…" style={inputStyle} />
                    )}
                  </div>
                  {appliances.length > 1 && (
                    <button type="button" onClick={() => removeAppliance(i)} style={{ width: 32, height: 36, borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "transparent", color: "#B44A2C", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addAppliance} style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-2)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                + Add Appliance
              </button>
            </div>
          </div>

          {/* Services */}
          <div>
            <SectionTitle>Services Required</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Toggle label="Installation" checked={installation} onChange={() => setInstallation(v => !v)} />
              <Toggle label="Removal" checked={removal} onChange={() => setRemoval(v => !v)} />
              <Toggle label="Elevator Access" checked={elevator} onChange={() => setElevator(v => !v)} />
              <Toggle label="Stair Carry" checked={stairCarry} onChange={() => setStairCarry(v => !v)} />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <SectionTitle>Schedule</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Preferred Date" required error={errors.preferredDate}>
                  <input type="date" value={preferredDate} onChange={e => { setPreferredDate(e.target.value); clearError("preferredDate"); }} style={{ ...inputStyle, borderColor: errors.preferredDate ? "#B44A2C" : undefined }} />
                </Field>
                <Field label="Alternate Date">
                  <input type="date" value={alternateDate} onChange={e => setAlternateDate(e.target.value)} style={inputStyle} />
                </Field>
              </div>
              <Field label="Time Window">
                <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} style={inputStyle}>
                  <option value="">No preference</option>
                  {TIME_WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Additional */}
          <div>
            <SectionTitle>Additional</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="F&P Order Number">
                <input type="text" value={fpOrderNumber} onChange={e => setFpOrderNumber(e.target.value)} placeholder="FP-12345" style={inputStyle} />
              </Field>
              <Field label="Access Notes">
                <input type="text" value={accessNotes} onChange={e => setAccessNotes(e.target.value)} placeholder="Parking, gate code, building access…" style={inputStyle} />
              </Field>
              <Field label="Notes">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any other details…" rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
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
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--hairline)", display: "flex", gap: 10, backgroundColor: "var(--surface)", flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 16px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", backgroundColor: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving} style={{ flex: 2, padding: "9px 16px", border: "none", borderRadius: 6, fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", backgroundColor: saving ? "var(--border)" : "#111111", color: saving ? "var(--text-3)" : "#ffffff", cursor: saving ? "default" : "pointer", transition: "background-color 150ms ease" }}>
            {saving ? "Creating…" : "Create Job"}
          </button>
        </div>
      </div>
    </>
  );
}
