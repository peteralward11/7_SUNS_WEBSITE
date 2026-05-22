interface ActivityEntry {
  id: string;
  user_name: string | null;
  type: string;
  content: string;
  created_at: string;
  bookings: { full_name: string } | null;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export default function RecentActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: 0 }}>
          Recent Activity
        </p>
        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Last 10 events</span>
      </div>

      <div style={{ padding: "8px 0" }}>
        {entries.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-3)", padding: "20px 24px", margin: 0 }}>
            No activity yet — status changes and notes will appear here.
          </p>
        ) : (
          entries.map((entry, i) => {
            const isStatus = entry.type === "status_change";
            const initial = (entry.user_name ?? "?")[0].toUpperCase();
            const customerName = entry.bookings?.full_name ?? "Unknown job";

            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "12px 24px",
                  borderBottom: i < entries.length - 1 ? "1px solid var(--hairline)" : "none",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: isStatus ? "#1F6FEB18" : "var(--hover)",
                  border: `1px solid ${isStatus ? "#1F6FEB44" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 700,
                  color: isStatus ? "#1F6FEB" : "var(--text-2)",
                }}>
                  {initial}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                      {entry.user_name ?? "System"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-3)" }}>on</span>
                    <span style={{ fontSize: "13px", color: "var(--text-2)", fontWeight: 500 }}>
                      {customerName}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-3)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "12px",
                    color: isStatus ? "#1F6FEB" : "var(--text-2)",
                    margin: 0,
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {entry.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
