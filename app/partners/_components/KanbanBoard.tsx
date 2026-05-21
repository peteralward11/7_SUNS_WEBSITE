"use client";
import { getStatusMeta } from "./PortalShell";

const COLUMNS = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];

interface Job {
  id: string;
  full_name: string;
  address?: string | null;
  preferred_date?: string | null;
  appliances?: unknown;
  status?: string | null;
  project_type?: string | null;
  fp_order_number?: string | null;
}

interface KanbanBoardProps {
  jobs: Job[];
  onJobClick: (id: string) => void;
}

export default function KanbanBoard({ jobs, onJobClick }: KanbanBoardProps) {
  function getAppliances(job: Job) {
    if (Array.isArray(job.appliances)) return (job.appliances as string[]).join(", ");
    return String(job.appliances ?? "—");
  }

  return (
    <div style={{
      display: "flex",
      gap: 12,
      overflowX: "auto",
      paddingBottom: 16,
      alignItems: "flex-start",
    }}>
      {COLUMNS.map(col => {
        const colJobs = jobs.filter(j => (j.status ?? "pending") === col);
        const meta = getStatusMeta(col);

        return (
          <div
            key={col}
            style={{
              minWidth: 240,
              maxWidth: 240,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Column header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--hover)",
            }}>
              <span style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: meta.color,
              }}>
                {meta.label}
              </span>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                color: colJobs.length > 0 ? meta.color : "var(--text-3)",
                backgroundColor: colJobs.length > 0 ? `${meta.color}18` : "transparent",
                padding: "2px 7px",
                borderRadius: 99,
              }}>
                {colJobs.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
              {colJobs.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-3)", textAlign: "center", padding: "12px 0", margin: 0 }}>
                  Empty
                </p>
              )}
              {colJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => onJobClick(job.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background-color 150ms ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--bg)")}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: 4, lineHeight: 1.2 }}>
                    {job.full_name}
                  </div>
                  {job.address && (
                    <div style={{ fontSize: "11px", color: "var(--text-2)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {job.address}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: "10px", color: "var(--text-3)" }}>
                      {job.preferred_date ?? "No date"}
                    </span>
                    {job.fp_order_number && (
                      <span style={{ fontSize: "10px", color: "var(--text-3)" }}>
                        #{job.fp_order_number}
                      </span>
                    )}
                  </div>
                  {getAppliances(job) !== "—" && (
                    <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getAppliances(job)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
