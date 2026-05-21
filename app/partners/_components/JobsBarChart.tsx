"use client";
import { useEffect, useRef } from "react";

interface MonthData {
  label: string;
  completed: number;
  active: number;
}

export default function JobsBarChart({ data }: { data: MonthData[] }) {
  const barsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll(".fp-bar");
    bars.forEach((bar, i) => {
      (bar as SVGElement).style.animationDelay = `${i * 60}ms`;
    });
  }, []);

  const max = Math.max(...data.map(d => d.completed + d.active), 1);
  const chartH = 80;
  const barW = 28;
  const gap = 16;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px" }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 16px" }}>
        Jobs per Month
      </p>
      <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 24}`} style={{ overflow: "visible", display: "block" }}>
        <g ref={barsRef}>
          {data.map((d, i) => {
            const x = i * (barW + gap);
            const totalH = Math.round((d.completed + d.active) / max * chartH);
            const completedH = Math.round(d.completed / max * chartH);
            const activeH = totalH - completedH;

            return (
              <g key={d.label}>
                {/* Active portion (steel blue) */}
                {activeH > 0 && (
                  <rect
                    className="fp-bar"
                    x={x}
                    y={chartH - totalH}
                    width={barW}
                    height={activeH}
                    fill="#1F6FEB"
                    opacity={0.5}
                    rx={2}
                  />
                )}
                {/* Completed portion (green) */}
                {completedH > 0 && (
                  <rect
                    className="fp-bar"
                    x={x}
                    y={chartH - completedH}
                    width={barW}
                    height={completedH}
                    fill="#1E7E4A"
                    rx={completedH === totalH ? 2 : 0}
                  />
                )}
                {/* Month label */}
                <text
                  x={x + barW / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--text-3)"
                  fontFamily="Inter, sans-serif"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
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
