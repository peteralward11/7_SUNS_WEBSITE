"use client";
import { useState } from "react";
import { getStatusMeta } from "./PortalShell";
import JobDrawer from "./JobDrawer";

interface Assignment {
  id: string;
  scheduled_date: string;
  time_start: string;
  time_end: string;
  booking_id: string;
  bookings: {
    id: string;
    full_name: string;
    address: string | null;
    appliances: unknown;
    status: string | null;
    fp_order_number: string | null;
  } | null;
}

function fmt12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = iso === today.toISOString().split("T")[0];
  const isTomorrow = iso === tomorrow.toISOString().split("T")[0];

  const weekday = d.toLocaleDateString("en-CA", { weekday: "long" });
  const full = d.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });

  if (isToday) return `Today — ${weekday}`;
  if (isTomorrow) return `Tomorrow — ${weekday}`;
  return full;
}

function getAppliances(a: unknown) {
  if (Array.isArray(a)) return a.join(", ");
  return String(a ?? "—");
}

export default function MySchedule({ assignments, teamMemberColor }: { assignments: Assignment[]; teamMemberColor: string }) {
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  if (assignments.length === 0) {
    return (
      <div style={{
        backgroundColor: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "56px 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>No upcoming jobs</p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>Your scheduled jobs will appear here.</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Assignment[]> = {};
  for (const a of assignments) {
    (grouped[a.scheduled_date] ??= []).push(a);
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {Object.entries(grouped).map(([date, group]) => (
          <div key={date}>
            {/* Date header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: 0 }}>
                {fmtDate(date)}
              </p>
              <div style={{ flex: 1, height: 1, backgroundColor: "var(--hairline)" }} />
            </div>

            {/* Job cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {group.map(a => {
                const booking = a.bookings;
                if (!booking) return null;
                const meta = getStatusMeta(booking.status ?? "pending");
                const timeWindow = `${fmt12h(a.time_start)} – ${fmt12h(a.time_end)}`;

                return (
                  <div
                    key={a.id}
                    onClick={() => setActiveBookingId(booking.id)}
                    style={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderLeft: `4px solid ${teamMemberColor}`,
                      borderRadius: 8,
                      padding: "16px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      transition: "background-color 100ms ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                          {booking.full_name}
                        </span>
                        {booking.fp_order_number && (
                          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>#{booking.fp_order_number}</span>
                        )}
                      </div>
                      {booking.address && (
                        <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {booking.address}
                        </p>
                      )}
                      <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
                        {getAppliances(booking.appliances)}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, color: meta.color,
                        letterSpacing: "0.04em", textTransform: "uppercase",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: meta.color, flexShrink: 0 }} />
                        {meta.label}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-3)", whiteSpace: "nowrap" }}>{timeWindow}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <JobDrawer
        bookingId={activeBookingId}
        isAdmin={false}
        onClose={() => setActiveBookingId(null)}
      />
    </>
  );
}
