"use client";
import { useRef, useState, useEffect } from "react";
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
  isAdmin: boolean;
  onJobClick: (id: string) => void;
}

export default function KanbanBoard({ jobs: initialJobs, isAdmin, onJobClick }: KanbanBoardProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!draggingId) setJobs(initialJobs);
  }, [initialJobs, draggingId]);
  const [overCol, setOverCol] = useState<string | null>(null);
  const dragJobId = useRef<string>("");

  function getAppliances(job: Job) {
    if (Array.isArray(job.appliances)) return (job.appliances as string[]).join(", ");
    return String(job.appliances ?? "—");
  }

  function onDragStart(jobId: string) {
    dragJobId.current = jobId;
    setDraggingId(jobId);
  }

  function onDragEnd() {
    setDraggingId(null);
    setOverCol(null);
  }

  function onDragOver(e: React.DragEvent, col: string) {
    e.preventDefault();
    setOverCol(col);
  }

  function onDragLeave() {
    setOverCol(null);
  }

  async function onDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    const jobId = dragJobId.current;
    if (!jobId) return;

    const job = jobs.find(j => j.id === jobId);
    if (!job || (job.status ?? "pending") === newStatus) {
      setDraggingId(null);
      setOverCol(null);
      return;
    }

    // Optimistic update
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    setDraggingId(null);
    setOverCol(null);

    // Persist
    const res = await fetch(`/api/partners/bookings/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      // Revert on failure
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: job.status } : j));
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
      {COLUMNS.map(col => {
        const colJobs = jobs.filter(j => (j.status ?? "pending") === col);
        const meta = getStatusMeta(col);
        const isOver = overCol === col;

        return (
          <div
            key={col}
            onDragOver={isAdmin ? e => onDragOver(e, col) : undefined}
            onDragLeave={isAdmin ? onDragLeave : undefined}
            onDrop={isAdmin ? e => onDrop(e, col) : undefined}
            style={{
              minWidth: 240,
              maxWidth: 240,
              backgroundColor: isOver ? `${meta.color}10` : "var(--surface)",
              border: isOver ? `2px solid ${meta.color}` : "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
              transition: "background-color 120ms ease, border-color 120ms ease",
            }}
          >
            {/* Column header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${isOver ? meta.color + "33" : "var(--hairline)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: isOver ? `${meta.color}18` : "var(--hover)",
            }}>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: meta.color }}>
                {meta.label}
              </span>
              <span style={{
                fontSize: "11px", fontWeight: 700,
                color: colJobs.length > 0 ? meta.color : "var(--text-3)",
                backgroundColor: colJobs.length > 0 ? `${meta.color}18` : "transparent",
                padding: "2px 7px", borderRadius: 99,
              }}>
                {colJobs.length}
              </span>
            </div>

            {/* Drop zone / cards */}
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, minHeight: 80 }}>
              {isOver && draggingId && (
                <div style={{
                  height: 4, borderRadius: 2,
                  backgroundColor: meta.color,
                  opacity: 0.6,
                  margin: "0 4px",
                }} />
              )}
              {colJobs.length === 0 && !isOver && (
                <p style={{ fontSize: "11px", color: "var(--text-3)", textAlign: "center", padding: "16px 0", margin: 0 }}>
                  {isAdmin ? "Drop here" : "Empty"}
                </p>
              )}
              {colJobs.map(job => {
                const isDragging = draggingId === job.id;
                return (
                  <div
                    key={job.id}
                    draggable={isAdmin}
                    onDragStart={isAdmin ? () => onDragStart(job.id) : undefined}
                    onDragEnd={isAdmin ? onDragEnd : undefined}
                    onClick={() => !isDragging && onJobClick(job.id)}
                    style={{
                      padding: 12,
                      backgroundColor: isDragging ? "var(--hover)" : "var(--bg)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${meta.color}`,
                      borderRadius: 6,
                      cursor: isAdmin ? "grab" : "pointer",
                      opacity: isDragging ? 0.4 : 1,
                      transition: "opacity 150ms ease, background-color 150ms ease",
                      userSelect: "none",
                    }}
                    onMouseEnter={e => { if (!isDragging) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--hover)"; }}
                    onMouseLeave={e => { if (!isDragging) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--bg)"; }}
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
                        <span style={{ fontSize: "10px", color: "var(--text-3)" }}>#{job.fp_order_number}</span>
                      )}
                    </div>
                    {getAppliances(job) !== "—" && (
                      <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {getAppliances(job)}
                      </div>
                    )}
                    {isAdmin && (
                      <div style={{ fontSize: "9px", color: "var(--text-3)", marginTop: 6, letterSpacing: "0.04em" }}>
                        ⠿ drag to move
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
