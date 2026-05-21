"use client";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending:       "#3F4A5C",
  quoted:        "#1F6FEB",
  confirmed:     "#1F6FEB",
  scheduled:     "#3F4A5C",
  "in progress": "#1F6FEB",
  completed:     "#1E7E4A",
  paid:          "#1E7E4A",
  issue:         "#B44A2C",
};

export default function AdminStatusSelect({
  bookingId,
  currentStatus,
  statuses,
}: {
  bookingId: string;
  currentStatus: string;
  statuses: string[];
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setSaving(true);
    setStatus(newStatus);
    await fetch(`/api/partners/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
  }

  const color = STATUS_COLORS[status] ?? "#7A7A7A";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <select
        value={status}
        onChange={handleChange}
        disabled={saving}
        style={{
          border: "1px solid #D9D9D9",
          padding: "5px 8px",
          fontSize: "13px",
          color: "#111111",
          backgroundColor: "#FFFFFF",
          cursor: saving ? "not-allowed" : "pointer",
          outline: "none",
        }}
      >
        {statuses.map(s => (
          <option key={s} value={s} style={{ textTransform: "capitalize" }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
