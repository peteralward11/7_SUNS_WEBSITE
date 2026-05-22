"use client";

interface MonthData {
  label: string;
  completed: number;
  active: number;
}

const CHART_H = 140;

export default function JobsBarChart({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.map(d => d.completed + d.active), 1);

  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "20px 24px",
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 16px" }}>
        Jobs per Month
      </p>

      {/* Bars area */}
      <div style={{ position: "relative", height: CHART_H }}>
        {/* Base gridline */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "1px solid var(--border)", pointerEvents: "none" }} />

        {/* Bars */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "flex-end",
          gap: 10, padding: "0 2px",
        }}>
          {data.map((d, i) => {
            const total = d.completed + d.active;
            const totalPct = (total / max) * 100;
            const completedPct = total > 0 ? (d.completed / total) * 100 : 0;
            const activePct = 100 - completedPct;
            return (
              <div
                key={i}
                title={`${total} job${total !== 1 ? "s" : ""} (${d.completed} completed, ${d.active} active)`}
                style={{
                  flex: 1,
                  height: `${totalPct}%`,
                  minHeight: total > 0 ? 3 : 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {d.active > 0 && (
                  <div style={{
                    flex: activePct,
                    backgroundColor: "#1F6FEB",
                    opacity: 0.5,
                    borderRadius: d.completed === 0 ? "2px 2px 0 0" : "2px 2px 0 0",
                  }} />
                )}
                {d.completed > 0 && (
                  <div style={{
                    flex: completedPct,
                    backgroundColor: "#1E7E4A",
                    borderRadius: d.active === 0 ? "2px 2px 0 0" : "0 0 0 0",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div style={{ display: "flex", gap: 10, padding: "6px 2px 0" }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: "center",
            fontSize: "10px",
            color: "var(--text-3)",
          }}>
            {d.label}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <LegendItem color="#1E7E4A" label="Completed" />
        <LegendItem color="#1F6FEB" opacity={0.5} label="Active" />
      </div>
    </div>
  );
}

function LegendItem({ color, opacity = 1, label }: { color: string; opacity?: number; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "var(--text-2)" }}>
      <span style={{ width: 10, height: 10, backgroundColor: color, opacity, borderRadius: 2, flexShrink: 0 }} />
      {label}
    </span>
  );
}
