"use client";
import { useState, useMemo } from "react";

type Period = "week" | "month" | "year" | "all";

interface BookingRef { full_name: string; email: string; }

interface Invoice {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  booking_id: string;
  bookings: BookingRef | BookingRef[] | null;
}

function getBooking(inv: Invoice): BookingRef | null {
  if (!inv.bookings) return null;
  return Array.isArray(inv.bookings) ? (inv.bookings[0] ?? null) : inv.bookings;
}

// ── Formatting ────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function fmtCurrencyFull(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function fmtCurrencyShort(n: number) {
  if (n === 0) return "$0";
  if (n >= 1000) return `$${n % 1000 === 0 ? n / 1000 : (n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

// ── Period helpers ────────────────────────────────────────────────────────────

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  if (period === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (period === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  if (period === "year")  return { start: new Date(now.getFullYear(), 0, 1), end: now };
  return { start: new Date(0), end: now };
}

function getPrevRange(period: Period): { start: Date; end: Date } | null {
  const now = new Date();
  if (period === "week") {
    const end = new Date(now); end.setDate(now.getDate() - 7); end.setHours(23, 59, 59, 999);
    const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  if (period === "year") {
    return {
      start: new Date(now.getFullYear() - 1, 0, 1),
      end:   new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    };
  }
  return null;
}

function filterByRange(invs: Invoice[], start: Date, end: Date) {
  return invs.filter(inv => { const d = new Date(inv.created_at); return d >= start && d <= end; });
}

function sumAll(invs: Invoice[])  { return invs.reduce((s, i) => s + (i.amount ?? 0), 0); }
function sumPaid(invs: Invoice[]) { return invs.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0); }

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
}

function niceMax(n: number) {
  if (n <= 0) return 100;
  const mag  = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

// ── Chart bucketing ───────────────────────────────────────────────────────────

function getChartBuckets(invs: Invoice[], period: Period): { label: string; amount: number }[] {
  const now = new Date();

  if (period === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i));
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      return { label: d.toLocaleDateString("en-CA", { weekday: "short" }), amount: filterByRange(invs, s, e).reduce((sum, inv) => sum + inv.amount, 0) };
    });
  }

  if (period === "month") {
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const out: { label: string; amount: number }[] = [];
    let ws = new Date(mStart), wn = 1;
    while (ws <= mEnd) {
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      if (we > mEnd) we.setTime(mEnd.getTime());
      we.setHours(23, 59, 59, 999);
      out.push({ label: `Wk ${wn}`, amount: filterByRange(invs, ws, we).reduce((s, i) => s + i.amount, 0) });
      ws = new Date(we); ws.setDate(we.getDate() + 1); ws.setHours(0, 0, 0, 0);
      wn++;
    }
    return out;
  }

  if (period === "year") {
    return Array.from({ length: 12 }, (_, i) => {
      const s = new Date(now.getFullYear(), i, 1);
      const e = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59, 999);
      return { label: s.toLocaleDateString("en-CA", { month: "short" }), amount: filterByRange(invs, s, e).reduce((sum, inv) => sum + inv.amount, 0) };
    });
  }

  // All time: last 12 months
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { label: d.toLocaleDateString("en-CA", { month: "short", year: "2-digit" }), amount: filterByRange(invs, s, e).reduce((sum, inv) => sum + inv.amount, 0) };
  });
}

// ── CSV export ────────────────────────────────────────────────────────────────

function downloadCSV(invs: Invoice[], period: string) {
  const rows = [
    ["Invoice ID", "Customer Name", "Customer Email", "Amount (CAD)", "Status", "Date Issued", "Date Paid"],
    ...invs.map(inv => {
      const b = getBooking(inv);
      return [
        inv.id,
        b?.full_name ?? "",
        b?.email ?? "",
        inv.amount.toFixed(2),
        inv.status,
        new Date(inv.created_at).toLocaleDateString("en-CA"),
        inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("en-CA") : "",
      ];
    }),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `7suns-revenue-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChangeChip({ value, period }: { value: number | null; period: Period }) {
  const suffix: Record<Period, string> = { week: "vs last wk", month: "vs last mo", year: "vs last yr", all: "" };
  if (value === null) return <span style={{ fontSize: "11px", color: "var(--text-3)" }}>—</span>;
  const up = value >= 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
      <span style={{
        fontSize: "11px", fontWeight: 700,
        color: up ? "#1E7E4A" : "#B44A2C",
        backgroundColor: up ? "rgba(30,126,74,0.08)" : "rgba(180,74,44,0.08)",
        border: `1px solid ${up ? "rgba(30,126,74,0.2)" : "rgba(180,74,44,0.2)"}`,
        borderRadius: 4, padding: "2px 6px",
      }}>
        {up ? "↑" : "↓"} {Math.abs(Math.round(value))}%
      </span>
      {suffix[period] && <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{suffix[period]}</span>}
    </span>
  );
}

function StatCard({ label, value, change, period }: { label: string; value: string; change: number | null; period: Period }) {
  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "20px 24px",
      flex: "1 1 160px",
      minWidth: 0,
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: "0 0 10px", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      <ChangeChip value={change} period={period} />
    </div>
  );
}

const CHART_H = 160;
const GRID_PCTS = [1, 0.75, 0.5, 0.25, 0];

function RevenueBarChart({ data }: { data: { label: string; amount: number }[] }) {
  const max  = Math.max(...data.map(d => d.amount), 1);
  const yMax = niceMax(max);
  const dense = data.length > 8;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
      {/* Y-axis labels */}
      <div style={{ width: 44, flexShrink: 0, position: "relative", height: CHART_H }}>
        {GRID_PCTS.map((pct, i) => (
          <span key={i} style={{
            position: "absolute",
            right: 8,
            top: (1 - pct) * CHART_H - 7,
            fontSize: "10px",
            lineHeight: 1,
            color: "var(--text-3)",
            whiteSpace: "nowrap",
          }}>
            {fmtCurrencyShort(yMax * pct)}
          </span>
        ))}
      </div>

      {/* Chart body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Bars area */}
        <div style={{ position: "relative", height: CHART_H }}>
          {/* Gridlines */}
          {GRID_PCTS.map((pct, i) => (
            <div key={i} style={{
              position: "absolute",
              left: 0, right: 0,
              top: (1 - pct) * CHART_H,
              borderTop: i === GRID_PCTS.length - 1
                ? "1px solid var(--border)"
                : "1px solid rgba(0,0,0,0.06)",
              pointerEvents: "none",
            }} />
          ))}

          {/* Bars */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "flex-end",
            gap: dense ? 3 : 5,
            padding: "0 2px",
          }}>
            {data.map((d, i) => {
              const hPct = yMax > 0 ? Math.max((d.amount / yMax) * 100, d.amount > 0 ? 1.5 : 0) : 0;
              return (
                <div
                  key={i}
                  title={fmtCurrencyFull(d.amount)}
                  style={{
                    flex: 1,
                    height: `${hPct}%`,
                    minHeight: d.amount > 0 ? 3 : 0,
                    backgroundColor: "#E8A33D",
                    borderRadius: "2px 2px 0 0",
                    opacity: d.amount === 0 ? 0.18 : 1,
                    transition: "height 250ms ease",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div style={{
          display: "flex",
          gap: dense ? 3 : 5,
          padding: "6px 2px 0",
        }}>
          {data.map((d, i) => (
            <div key={i} style={{
              flex: 1,
              textAlign: "center",
              fontSize: dense ? "9px" : "10px",
              color: "var(--text-3)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {d.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<Period, string> = {
  week: "This Week", month: "This Month", year: "This Year", all: "All Time",
};

export default function ReportsClient({ invoices }: { invoices: Invoice[] }) {
  const [period, setPeriod] = useState<Period>("month");

  const { current, stats, chartData } = useMemo(() => {
    const { start, end } = getPeriodRange(period);
    const prevRange = getPrevRange(period);

    const current = filterByRange(invoices, start, end);
    const prev    = prevRange ? filterByRange(invoices, prevRange.start, prevRange.end) : [];

    const revenue     = sumAll(current);
    const collected   = sumPaid(current);
    const outstanding = revenue - collected;
    const avg         = current.length > 0 ? revenue / current.length : 0;

    const pRevenue     = sumAll(prev);
    const pCollected   = sumPaid(prev);
    const pOutstanding = pRevenue - pCollected;
    const pAvg         = prev.length > 0 ? pRevenue / prev.length : 0;

    return {
      current,
      stats: {
        revenue, collected, outstanding, avg,
        changes: {
          revenue:     prevRange ? pctChange(revenue, pRevenue)         : null,
          collected:   prevRange ? pctChange(collected, pCollected)     : null,
          outstanding: prevRange ? pctChange(outstanding, pOutstanding) : null,
          avg:         prevRange ? pctChange(avg, pAvg)                 : null,
        },
      },
      chartData: getChartBuckets(invoices, period),
    };
  }, [invoices, period]);

  return (
    <div>
      {/* Period tabs + CSV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 3, backgroundColor: "var(--hover)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {(["week", "month", "year", "all"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 14px",
                borderRadius: 6, border: "none",
                fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em",
                cursor: "pointer", whiteSpace: "nowrap",
                backgroundColor: period === p ? "var(--surface)" : "transparent",
                color:           period === p ? "var(--text)"    : "var(--text-3)",
                boxShadow:       period === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 150ms ease",
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <button
          onClick={() => downloadCSV(current, period)}
          style={{
            padding: "7px 14px",
            backgroundColor: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em",
            color: "var(--text-2)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            transition: "color 150ms ease",
          }}
        >
          ↓ Download CSV
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total Revenue"  value={fmtCurrency(stats.revenue)}     change={stats.changes.revenue}     period={period} />
        <StatCard label="Collected"      value={fmtCurrency(stats.collected)}    change={stats.changes.collected}   period={period} />
        <StatCard label="Outstanding"    value={fmtCurrency(stats.outstanding)}  change={stats.changes.outstanding} period={period} />
        <StatCard label="Avg. Job Value" value={fmtCurrency(stats.avg)}          change={stats.changes.avg}         period={period} />
      </div>

      {/* Revenue chart */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: 0 }}>
            Revenue over time
          </p>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
            {fmtCurrency(stats.revenue)}
          </span>
        </div>

        {invoices.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center", padding: "48px 0", margin: 0 }}>
            No invoices yet — revenue will appear here once jobs are invoiced.
          </p>
        ) : (
          <RevenueBarChart data={chartData} />
        )}
      </div>
    </div>
  );
}
