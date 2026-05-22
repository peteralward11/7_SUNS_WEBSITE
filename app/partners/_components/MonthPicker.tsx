"use client";
import { useRouter, useSearchParams } from "next/navigation";

const BTN: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  border: "1px solid var(--border)", borderRadius: 6, backgroundColor: "transparent",
  color: "var(--text-2)", cursor: "pointer", fontSize: "14px", flexShrink: 0,
};

const BTN_DISABLED: React.CSSProperties = {
  ...BTN, opacity: 0.3, cursor: "default",
};

export default function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = value === nowStr;

  function go(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    const p = new URLSearchParams(searchParams.toString());
    if (nextStr === nowStr) {
      p.delete("month");
    } else {
      p.set("month", nextStr);
    }
    router.push(`?${p.toString()}`);
  }

  const label = date.toLocaleDateString("en-CA", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => go(-1)} style={BTN} title="Previous month">‹</button>
      <span style={{
        fontSize: "13px", fontWeight: 600, color: "var(--text)",
        minWidth: 120, textAlign: "center", letterSpacing: "-0.01em",
      }}>
        {label}
        {isCurrentMonth && (
          <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-3)", marginLeft: 6 }}>current</span>
        )}
      </span>
      <button
        onClick={() => go(1)}
        disabled={isCurrentMonth}
        style={isCurrentMonth ? BTN_DISABLED : BTN}
        title="Next month"
      >›</button>
    </div>
  );
}
