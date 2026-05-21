"use client";

const STATUS_META: Record<string, { color: string; label: string }> = {
  pending:        { color: "#3F4A5C", label: "Pending" },
  quoted:         { color: "#1F6FEB", label: "Quoted" },
  confirmed:      { color: "#1F6FEB", label: "Confirmed" },
  scheduled:      { color: "#3F4A5C", label: "Scheduled" },
  "in progress":  { color: "#1F6FEB", label: "In Progress" },
  completed:      { color: "#1E7E4A", label: "Completed" },
  paid:           { color: "#1E7E4A", label: "Paid" },
  issue:          { color: "#B44A2C", label: "Issue" },
};

export function getStatusMeta(status: string) {
  return STATUS_META[status?.toLowerCase()] ?? { color: "#7A7A7A", label: status ?? "Pending" };
}

export function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: meta.color, flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{meta.label}</span>
    </span>
  );
}

export function MetricCard({
  label, value, sub, accentColor
}: {
  label: string; value: string | number; sub?: string; accentColor?: string;
}) {
  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid var(--border)",
      padding: "20px 24px",
      flex: "1 1 0",
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

export function PortalFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--hairline)", padding: "14px 40px", backgroundColor: "var(--surface)" }}>
      <p style={{ fontSize: "8.5pt", color: "var(--text-3)", margin: 0 }}>
        © Fisher &amp; Paykel Appliances Ltd · Delivery &amp; installation by 7Suns, an authorised Fisher &amp; Paykel partner.
      </p>
    </footer>
  );
}
