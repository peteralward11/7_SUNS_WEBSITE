"use client";
import { useState } from "react";
import { getStatusMeta } from "./PortalShell";

const STAGES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"] as const;
type Stage = typeof STAGES[number];

export default function WorkflowSteps({
  bookingId,
  currentStatus,
  isAdmin,
  onStatusChange,
}: {
  bookingId: string;
  currentStatus: string;
  isAdmin: boolean;
  onStatusChange?: (newStatus: string) => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const currentIdx = STAGES.indexOf(status as Stage);
  const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;

  async function advance() {
    if (!nextStage || loading) return;
    await updateStatus(nextStage);
  }

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const res = await fetch(`/api/partners/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    }
    setLoading(false);
  }

  return (
    <div>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 14px" }}>
        Workflow
      </p>

      {/* Step dots */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 6 }}>
        {/* connector line */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "var(--border)",
          transform: "translateY(-50%)",
          zIndex: 0,
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: `${Math.max(0, currentIdx) / (STAGES.length - 1) * 100}%`,
          height: 2,
          backgroundColor: "#1E7E4A",
          transform: "translateY(-50%)",
          zIndex: 1,
          transition: "width 400ms ease",
        }} />

        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const meta = getStatusMeta(stage);
          return (
            <div
              key={stage}
              title={meta.label}
              onClick={() => isAdmin && !loading && updateStatus(stage)}
              style={{
                position: "relative",
                zIndex: 2,
                flex: i < STAGES.length - 1 ? "1 1 0" : "0 0 auto",
                display: "flex",
                justifyContent: i === 0 ? "flex-start" : i === STAGES.length - 1 ? "flex-end" : "center",
              }}
            >
              <div style={{
                width: active ? 16 : 12,
                height: active ? 16 : 12,
                borderRadius: "50%",
                backgroundColor: done ? "#1E7E4A" : active ? meta.color : "var(--border)",
                border: active ? `2px solid ${meta.color}` : done ? "none" : "2px solid var(--border)",
                cursor: isAdmin ? "pointer" : "default",
                transition: "all 200ms ease",
                boxShadow: active ? `0 0 0 3px ${meta.color}22` : "none",
              }} />
            </div>
          );
        })}
      </div>

      {/* Stage labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        {STAGES.map((stage, i) => {
          const meta = getStatusMeta(stage);
          const active = i === currentIdx;
          return (
            <div
              key={stage}
              style={{
                fontSize: "8px",
                color: active ? meta.color : "var(--text-3)",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.04em",
                textAlign: i === 0 ? "left" : i === STAGES.length - 1 ? "right" : "center",
                flex: i < STAGES.length - 1 ? "1 1 0" : "0 0 auto",
                textTransform: "uppercase",
              }}
            >
              {meta.label}
            </div>
          );
        })}
      </div>

      {/* Next Step button */}
      {isAdmin && nextStage && (
        <button
          onClick={advance}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "var(--border)" : "#111111",
            color: loading ? "var(--text-3)" : "#FFFFFF",
            border: "none",
            borderRadius: 6,
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            transition: "background-color 150ms ease",
          }}
        >
          {loading ? "Updating…" : `Next: ${getStatusMeta(nextStage).label} →`}
        </button>
      )}

      {/* Override dropdown for admin */}
      {isAdmin && (
        <select
          value={status}
          onChange={e => updateStatus(e.target.value)}
          disabled={loading}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: "12px",
            backgroundColor: "var(--input-bg)",
            color: "var(--text-2)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {STAGES.map(s => (
            <option key={s} value={s}>{getStatusMeta(s).label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
