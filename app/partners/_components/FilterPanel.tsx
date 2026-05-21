"use client";
import { useEffect, useRef, useState } from "react";
import { getStatusMeta } from "./PortalShell";

const ALL_STATUSES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];

export interface Filters {
  statuses: string[];
  projectType: "all" | "residential" | "builder";
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: Filters = {
  statuses: [],
  projectType: "all",
  dateFrom: "",
  dateTo: "",
};

interface FilterPanelProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const activeCount =
    filters.statuses.length +
    (filters.projectType !== "all" ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  function toggleStatus(s: string) {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter(x => x !== s)
      : [...filters.statuses, s];
    onChange({ ...filters, statuses: next });
  }

  function clear() {
    onChange(DEFAULT_FILTERS);
  }

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: "12px",
    border: "1px solid var(--border)",
    borderRadius: 4,
    backgroundColor: "var(--input-bg)",
    color: "var(--text)",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          backgroundColor: open ? "var(--text)" : "var(--surface)",
          color: open ? "var(--bg)" : "var(--text-2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 150ms ease",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span style={{ backgroundColor: "#B44A2C", color: "#FFFFFF", borderRadius: 99, fontSize: "10px", fontWeight: 700, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fp-backdrop"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 20,
            width: 300,
            zIndex: 50,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 8px" }}>Status</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_STATUSES.map(s => {
                const meta = getStatusMeta(s);
                const active = filters.statuses.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 99,
                      border: `1px solid ${active ? meta.color : "var(--border)"}`,
                      backgroundColor: active ? `${meta.color}18` : "transparent",
                      color: active ? meta.color : "var(--text-2)",
                      fontSize: "11px",
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Type */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 8px" }}>Type</p>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "residential", "builder"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onChange({ ...filters, projectType: t })}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: `1px solid ${filters.projectType === t ? "var(--text)" : "var(--border)"}`,
                    backgroundColor: filters.projectType === t ? "var(--text)" : "transparent",
                    color: filters.projectType === t ? "var(--bg)" : "var(--text-2)",
                    fontSize: "11px",
                    fontWeight: filters.projectType === t ? 700 : 400,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 150ms ease",
                  }}
                >
                  {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 8px" }}>Date Range</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" style={inputStyle} value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })} />
              <input type="date" style={inputStyle} value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })} />
            </div>
          </div>

          {/* Clear */}
          {activeCount > 0 && (
            <button
              onClick={clear}
              style={{
                width: "100%",
                padding: "7px",
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: "12px",
                color: "var(--text-3)",
                cursor: "pointer",
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
