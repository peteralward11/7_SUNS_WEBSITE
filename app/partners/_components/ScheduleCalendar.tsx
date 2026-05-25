"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import JobDrawer from "./JobDrawer";
import TeamManageModal from "./TeamManageModal";

/* ── Types ───────────────────────────────────────────── */
export interface TeamMember { id: string; name: string; role: string; color: string }
interface UnscheduledJob {
  id: string; full_name: string; address: string | null;
  appliances: unknown; status: string; fp_order_number: string | null;
  email: string; phone: string | null; preferred_date: string | null;
}
interface Assignment {
  id: string; scheduled_date: string; time_start: string; time_end: string;
  booking_id: string; team_member_id: string;
  fp_team_members: TeamMember;
  bookings: { id: string; full_name: string; address: string | null; appliances: unknown; status: string; fp_order_number: string | null; email: string; phone: string | null };
}

type CalView = "day" | "week" | "month";
const TIME_WINDOWS = ["Morning", "Afternoon", "Anytime"] as const;
type TimeWindow = typeof TIME_WINDOWS[number];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm
const COLOR_PRESETS = ["#E8A33D", "#1F6FEB", "#1E7E4A", "#B44A2C", "#7C3AED", "#0891B2"];

function fmt12(h24: string) {
  const [h] = h24.split(":").map(Number);
  return h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}
function windowLabel(tw: TimeWindow) {
  if (tw === "Morning") return "8am – 12pm";
  if (tw === "Afternoon") return "12pm – 4pm";
  return "8am – 4pm";
}
function windowToHours(tw: TimeWindow): [number, number] {
  if (tw === "Morning") return [8, 12];
  if (tw === "Afternoon") return [12, 16];
  return [8, 16];
}
function hhmm(h: number) { return `${String(h).padStart(2, "0")}:00`; }

function getAppliances(a: unknown): string {
  if (Array.isArray(a)) return (a as { type?: string }[]).map(x => x?.type || String(x)).filter(Boolean).join(", ");
  return String(a ?? "");
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function startOfWeek(d: Date) {
  const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

function fmtDay(d: Date) {
  return d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}
function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

/* ── Drag state singleton ────────────────────────────── */
let _dragJobId = "";

/* ── Main Component ──────────────────────────────────── */
export default function ScheduleCalendar({
  initialTeam, initialUnscheduled, today,
}: {
  initialTeam: TeamMember[];
  initialUnscheduled: UnscheduledJob[];
  today: string;
}) {
  const [view, setView] = useState<CalView>("week");
  const [mobileUnscheduledOpen, setMobileUnscheduledOpen] = useState(false);
  const [activeDate, setActiveDate] = useState(new Date(today + "T12:00:00"));
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [unscheduled, setUnscheduled] = useState<UnscheduledJob[]>(initialUnscheduled);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<{ jobId: string; memberId: string; date: string } | null>(null);
  const [schedWindow, setSchedWindow] = useState<TimeWindow>("Morning");
  const [saving, setSaving] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  /* ── Force day view on mobile ── */
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 769) {
      setView("day");
    }
  }, []);

  /* ── Date range for fetch ───── */
  function rangeForView(): { start: string; end: string } {
    if (view === "day") return { start: isoDate(activeDate), end: isoDate(activeDate) };
    if (view === "week") {
      const s = startOfWeek(activeDate);
      return { start: isoDate(s), end: isoDate(addDays(s, 6)) };
    }
    return { start: isoDate(startOfMonth(activeDate)), end: isoDate(endOfMonth(activeDate)) };
  }

  const fetchAssignments = useCallback(async () => {
    setLoadingCal(true);
    const { start, end } = rangeForView();
    try {
      const res = await fetch(`/api/partners/schedule?start=${start}&end=${end}`);
      const d = await res.json();
      setAssignments(d.assignments ?? []);
    } catch { /* ignore */ }
    setLoadingCal(false);
  }, [view, activeDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  /* ── Navigation ─────────────── */
  function navigate(dir: 1 | -1) {
    if (view === "day") setActiveDate(d => addDays(d, dir));
    else if (view === "week") setActiveDate(d => addDays(d, dir * 7));
    else setActiveDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  }

  /* ── Scheduling ─────────────── */
  async function confirmSchedule() {
    if (!scheduling) return;
    setSaving(true);
    try {
      const res = await fetch("/api/partners/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: scheduling.jobId,
          team_member_id: scheduling.memberId,
          scheduled_date: scheduling.date,
          time_window: schedWindow,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setUnscheduled(u => u.filter(j => j.id !== scheduling.jobId));
        await fetchAssignments();
        setScheduling(null);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function removeAssignment(assignmentId: string, bookingId: string) {
    await fetch(`/api/partners/schedule/${assignmentId}`, { method: "DELETE" });
    setAssignments(a => a.filter(x => x.id !== assignmentId));
    // Check if any remaining assignments exist for this booking
    const remaining = assignments.filter(a => a.id !== assignmentId && a.booking_id === bookingId);
    if (remaining.length === 0) {
      // Refetch unscheduled list
      const res = await fetch(`/api/partners/schedule?start=${today}&end=${today}`);
      // Just refetch full unscheduled via page reload workaround — refresh assignments instead
      await fetchAssignments();
    }
  }

  /* ── Drag handlers ──────────── */
  function onDragStart(jobId: string) { _dragJobId = jobId; }
  function onDragOver(e: React.DragEvent, key: string) { e.preventDefault(); setDragOverKey(key); }
  function onDragLeave() { setDragOverKey(null); }
  function onDrop(e: React.DragEvent, memberId: string, date: string) {
    e.preventDefault();
    setDragOverKey(null);
    if (!_dragJobId) return;
    setScheduling({ jobId: _dragJobId, memberId, date });
    setSchedWindow("Morning");
    _dragJobId = "";
  }

  const navLabel = view === "day" ? fmtDay(activeDate)
    : view === "week" ? `${fmtDay(startOfWeek(activeDate))} – ${fmtDay(addDays(startOfWeek(activeDate), 6))}`
    : fmtMonthYear(activeDate);

  return (
    <div>
      {/* ── Top bar ─────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => navigate(-1)} style={navBtn}>←</button>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", flex: 1, textAlign: "center" }}>{navLabel}</span>
        <button onClick={() => navigate(1)} style={navBtn}>→</button>
        <button onClick={() => setActiveDate(new Date(today + "T12:00:00"))} style={{ ...navBtn, fontSize: "11px" }}>Today</button>

        <div className="fp-no-mobile" style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {(["day", "week", "month"] as CalView[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "5px 12px", borderRadius: 6, fontSize: "12px", fontWeight: 600,
              backgroundColor: view === v ? "var(--text)" : "transparent",
              color: view === v ? "var(--bg)" : "var(--text-3)",
              border: "1px solid var(--border)", cursor: "pointer", textTransform: "capitalize",
            }}>{v}</button>
          ))}
          <button onClick={() => setTeamOpen(true)} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: "12px", fontWeight: 600,
            backgroundColor: "transparent", border: "1px solid var(--border)",
            color: "var(--text-2)", cursor: "pointer", marginLeft: 4,
          }}>Manage Team</button>
        </div>

      </div>

      {/* Mobile unscheduled jobs bar */}
      {unscheduled.length > 0 && (
        <button
          className="fp-mobile-block"
          onClick={() => setMobileUnscheduledOpen(true)}
          style={{
            width: "100%", padding: "12px 16px", marginBottom: 12,
            backgroundColor: "#E8A33D18", border: "1.5px solid #E8A33D55",
            borderRadius: 10, cursor: "pointer", textAlign: "left",
            color: "#E8A33D", fontSize: "13px", fontWeight: 700,
            fontFamily: "inherit",
          }}
        >
          {unscheduled.length} Unscheduled Job{unscheduled.length !== 1 ? "s" : ""} — tap to assign
        </button>
      )}

      {/* ── Schedule window popover ── */}
      {scheduling && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setScheduling(null)}>
          <div style={{ backgroundColor: "var(--surface)", borderRadius: 12, padding: 24, minWidth: 280, border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px" }}>Choose Time Window</p>
            <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "0 0 14px" }}>
              {scheduling.date} · {team.find(m => m.id === scheduling.memberId)?.name}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {TIME_WINDOWS.map(tw => (
                <button key={tw} onClick={() => setSchedWindow(tw)} style={{
                  padding: "10px 14px", borderRadius: 8, textAlign: "left",
                  backgroundColor: schedWindow === tw ? "var(--text)" : "var(--hover)",
                  color: schedWindow === tw ? "var(--bg)" : "var(--text)",
                  border: `1px solid ${schedWindow === tw ? "var(--text)" : "var(--border)"}`,
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                }}>
                  {tw} <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.7 }}>({windowLabel(tw)})</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setScheduling(null)} style={{ flex: 1, padding: "9px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
              <button onClick={confirmSchedule} disabled={saving} style={{ flex: 2, padding: "9px", borderRadius: 8, backgroundColor: "var(--text)", color: "var(--bg)", border: "none", cursor: saving ? "default" : "pointer", fontSize: "13px", fontWeight: 600 }}>
                {saving ? "Scheduling…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Views ──────────────────── */}
      {view === "day" && <DayView activeDate={activeDate} team={team} assignments={assignments} unscheduled={unscheduled} loading={loadingCal} dragOverKey={dragOverKey} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onJobClick={setOpenJobId} onRemove={removeAssignment} />}
      {view === "week" && <WeekView activeDate={activeDate} team={team} assignments={assignments} unscheduled={unscheduled} loading={loadingCal} dragOverKey={dragOverKey} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onJobClick={setOpenJobId} onRemove={removeAssignment} onDayClick={d => { setActiveDate(d); setView("day"); }} />}
      {view === "month" && <MonthView activeDate={activeDate} assignments={assignments} loading={loadingCal} onJobClick={setOpenJobId} onDayClick={d => { setActiveDate(d); setView("day"); }} />}

      {/* ── Mobile unscheduled sheet ── */}
      {mobileUnscheduledOpen && (
        <>
          <div onClick={() => setMobileUnscheduledOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, animation: "fp-fade-in 200ms ease" }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--surface)", borderRadius: "20px 20px 0 0", border: "1px solid var(--border)", zIndex: 201, animation: "fp-slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)", maxHeight: "75vh", display: "flex", flexDirection: "column", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <div style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "var(--border)", margin: "14px auto 0" }} />
            <div style={{ padding: "12px 20px 8px", borderBottom: "1px solid var(--hairline)", flexShrink: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Unscheduled Jobs ({unscheduled.length})</p>
              <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "2px 0 0" }}>Use the calendar above to assign these jobs</p>
            </div>
            <div style={{ overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {unscheduled.map(job => (
                <div key={job.id} style={{ padding: "12px 14px", backgroundColor: "var(--hover)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>{job.full_name}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-2)", margin: "0 0 2px" }}>{job.fp_order_number ? `#${job.fp_order_number}` : ""}{job.fp_order_number && job.address ? " · " : ""}{job.address ?? ""}</p>
                  {job.preferred_date && <p style={{ fontSize: "11px", color: "#1F6FEB", margin: 0 }}>Preferred: {new Date(job.preferred_date + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ─────────────────── */}
      <TeamManageModal open={teamOpen} onClose={() => setTeamOpen(false)} team={team} colorPresets={COLOR_PRESETS} onTeamChange={setTeam} />
      <JobDrawer bookingId={openJobId} isAdmin onClose={() => setOpenJobId(null)} />
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────── */
const navBtn: React.CSSProperties = {
  padding: "5px 12px", borderRadius: 6, backgroundColor: "transparent",
  border: "1px solid var(--border)", color: "var(--text-2)",
  cursor: "pointer", fontSize: "13px", fontWeight: 600,
};

/* ── Unscheduled Queue ───────────────────────────────── */
function UnscheduledQueue({ jobs, onDragStart }: { jobs: UnscheduledJob[]; onDragStart: (id: string) => void }) {
  return (
    <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--hairline)", paddingRight: 12, marginRight: 12 }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 10px" }}>
        Unscheduled ({jobs.length})
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflowY: "auto" }}>
        {jobs.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>All jobs scheduled</p>}
        {jobs.map(job => (
          <div
            key={job.id}
            draggable
            onDragStart={() => onDragStart(job.id)}
            style={{
              padding: "8px 10px", backgroundColor: "var(--hover)", border: "1px solid var(--border)",
              borderRadius: 8, cursor: "grab", userSelect: "none",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>
              {job.fp_order_number ? `#${job.fp_order_number}` : "—"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-2)", margin: "0 0 2px" }}>{job.full_name}</p>
            <p style={{ fontSize: "10px", color: "var(--text-3)", margin: 0 }}>{getAppliances(job.appliances)}</p>
            {job.preferred_date && (
              <p style={{ fontSize: "10px", color: "#1F6FEB", margin: "3px 0 0" }}>
                Pref: {new Date(job.preferred_date + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Assignment Block ────────────────────────────────── */
function AssignmentBlock({ a, onJobClick, onRemove }: { a: Assignment; onJobClick: (id: string) => void; onRemove: (assignmentId: string, bookingId: string) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        backgroundColor: a.fp_team_members.color + "22",
        border: `1.5px solid ${a.fp_team_members.color}`,
        borderRadius: 6, padding: "4px 8px", cursor: "pointer",
        position: "relative", minHeight: 40,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onJobClick(a.booking_id)}
    >
      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", margin: "0 0 1px", paddingRight: 16 }}>
        {a.bookings.fp_order_number ? `#${a.bookings.fp_order_number}` : "—"}
      </p>
      <p style={{ fontSize: "10px", color: "var(--text-2)", margin: 0 }}>{a.bookings.full_name}</p>
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(a.id, a.booking_id); }}
          style={{ position: "absolute", top: 3, right: 4, background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-3)", lineHeight: 1, padding: 0 }}
        >×</button>
      )}
    </div>
  );
}

/* ── Day View ────────────────────────────────────────── */
function DayView({ activeDate, team, assignments, unscheduled, loading, dragOverKey, onDragStart, onDragOver, onDragLeave, onDrop, onJobClick, onRemove }: {
  activeDate: Date; team: TeamMember[]; assignments: Assignment[]; unscheduled: UnscheduledJob[];
  loading: boolean; dragOverKey: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, key: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, memberId: string, date: string) => void;
  onJobClick: (id: string) => void;
  onRemove: (assignmentId: string, bookingId: string) => void;
}) {
  const dateStr = isoDate(activeDate);
  const dayAssignments = assignments.filter(a => a.scheduled_date === dateStr);

  if (team.length === 0) {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <div className="fp-no-mobile" style={{ display: "contents" }}>
          <UnscheduledQueue jobs={unscheduled} onDragStart={onDragStart} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, backgroundColor: "var(--hover)", borderRadius: 10, border: "1px dashed var(--border)" }}>
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Add team members to start scheduling</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div className="fp-no-mobile" style={{ display: "contents" }}>
        <UnscheduledQueue jobs={unscheduled} onDragStart={onDragStart} />
      </div>
      <div style={{ flex: 1, overflowX: "auto" }}>
        {loading && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "0 0 8px" }}>Loading…</p>}
        <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${team.length}, 1fr)`, minWidth: team.length * 140 + 56 }}>
          {/* Header */}
          <div />
          {team.map(m => (
            <div key={m.id} style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid var(--hairline)", borderLeft: "1px solid var(--hairline)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: m.color, display: "inline-block", marginRight: 5 }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{m.name}</span>
              <p style={{ fontSize: "10px", color: "var(--text-3)", margin: "1px 0 0", textTransform: "capitalize" }}>{m.role}</p>
            </div>
          ))}
          {/* Time rows */}
          {HOURS.map(h => (
            <>
              <div key={`t-${h}`} style={{ padding: "10px 6px 10px 0", textAlign: "right", fontSize: "10px", color: "var(--text-3)", borderTop: "1px solid var(--hairline)", height: 52 }}>
                {fmt12(hhmm(h))}
              </div>
              {team.map(m => {
                const key = `${m.id}|${dateStr}|${h}`;
                const cellAssignments = dayAssignments.filter(a =>
                  a.team_member_id === m.id &&
                  parseInt(a.time_start) === h
                );
                return (
                  <div
                    key={`cell-${m.id}-${h}`}
                    onDragOver={e => onDragOver(e, key)}
                    onDragLeave={onDragLeave}
                    onDrop={e => onDrop(e, m.id, dateStr)}
                    style={{
                      borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)",
                      height: 52, padding: 4, position: "relative",
                      backgroundColor: dragOverKey === key ? "rgba(31,111,235,0.06)" : "transparent",
                      transition: "background-color 100ms",
                    }}
                  >
                    {cellAssignments.map(a => <AssignmentBlock key={a.id} a={a} onJobClick={onJobClick} onRemove={onRemove} />)}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Week View ───────────────────────────────────────── */
function WeekView({ activeDate, team, assignments, unscheduled, loading, dragOverKey, onDragStart, onDragOver, onDragLeave, onDrop, onJobClick, onRemove, onDayClick }: {
  activeDate: Date; team: TeamMember[]; assignments: Assignment[]; unscheduled: UnscheduledJob[];
  loading: boolean; dragOverKey: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, key: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, memberId: string, date: string) => void;
  onJobClick: (id: string) => void;
  onRemove: (assignmentId: string, bookingId: string) => void;
  onDayClick: (d: Date) => void;
}) {
  const weekStart = startOfWeek(activeDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <UnscheduledQueue jobs={unscheduled} onDragStart={onDragStart} />
      <div style={{ flex: 1, overflowX: "auto" }}>
        {loading && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "0 0 8px" }}>Loading…</p>}
        <div style={{ display: "grid", gridTemplateColumns: `56px repeat(7, 1fr)`, minWidth: 700 }}>
          {/* Header */}
          <div />
          {days.map(d => {
            const ds = isoDate(d);
            const count = assignments.filter(a => a.scheduled_date === ds).length;
            return (
              <div key={ds} onClick={() => onDayClick(d)} style={{ padding: "8px 10px", textAlign: "center", borderBottom: "2px solid var(--hairline)", borderLeft: "1px solid var(--hairline)", cursor: "pointer" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  {d.toLocaleDateString("en-CA", { weekday: "short" })}
                </p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: ds === isoDate(new Date()) ? "#1F6FEB" : "var(--text)", margin: "1px 0 0" }}>
                  {d.getDate()}
                </p>
                {count > 0 && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#1F6FEB", margin: "3px auto 0" }} />}
              </div>
            );
          })}
          {/* Time rows */}
          {HOURS.map(h => (
            <>
              <div key={`t-${h}`} style={{ padding: "10px 6px 10px 0", textAlign: "right", fontSize: "10px", color: "var(--text-3)", borderTop: "1px solid var(--hairline)", height: 52 }}>
                {fmt12(hhmm(h))}
              </div>
              {days.map(d => {
                const ds = isoDate(d);
                const key = `week|${ds}|${h}`;
                const cellAssignments = assignments.filter(a =>
                  a.scheduled_date === ds && parseInt(a.time_start) === h
                );
                return (
                  <div
                    key={`cell-${ds}-${h}`}
                    onDragOver={e => onDragOver(e, key)}
                    onDragLeave={onDragLeave}
                    onDrop={e => {
                      // For week view, if there's only one team member use them; else pick first
                      const memberId = team[0]?.id;
                      if (memberId) onDrop(e, memberId, ds);
                    }}
                    style={{
                      borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)",
                      height: 52, padding: 4,
                      backgroundColor: dragOverKey === key ? "rgba(31,111,235,0.06)" : "transparent",
                      transition: "background-color 100ms",
                    }}
                  >
                    {cellAssignments.map(a => (
                      <div key={a.id} onClick={() => onJobClick(a.booking_id)} style={{
                        backgroundColor: a.fp_team_members.color + "22",
                        border: `1.5px solid ${a.fp_team_members.color}`,
                        borderRadius: 5, padding: "2px 6px", cursor: "pointer", marginBottom: 2,
                      }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text)" }}>
                          {a.bookings.fp_order_number ? `#${a.bookings.fp_order_number}` : "—"}
                        </span>
                        <span style={{ fontSize: "9px", color: "var(--text-3)", marginLeft: 4 }}>
                          {a.fp_team_members.name.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Month View ──────────────────────────────────────── */
function MonthView({ activeDate, assignments, loading, onJobClick, onDayClick }: {
  activeDate: Date; assignments: Assignment[]; loading: boolean;
  onJobClick: (id: string) => void; onDayClick: (d: Date) => void;
}) {
  const ms = startOfMonth(activeDate);
  const me = endOfMonth(activeDate);
  const startPad = (ms.getDay() + 6) % 7; // Monday-first offset
  const totalCells = Math.ceil((startPad + me.getDate()) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > me.getDate()) return null;
    return new Date(activeDate.getFullYear(), activeDate.getMonth(), dayNum);
  });

  const todayStr = isoDate(new Date());

  return (
    <div>
      {loading && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "0 0 8px" }}>Loading…</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} style={{ padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)", textAlign: "center", backgroundColor: "var(--hover)" }}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} style={{ borderBottom: "1px solid var(--hairline)", borderRight: i % 7 < 6 ? "1px solid var(--hairline)" : "none", minHeight: 90, backgroundColor: "var(--hover)", opacity: 0.4 }} />;
          const ds = isoDate(d);
          const dayJobs = assignments.filter(a => a.scheduled_date === ds);
          const isToday = ds === todayStr;
          return (
            <div
              key={ds}
              onClick={() => onDayClick(d)}
              style={{
                borderBottom: "1px solid var(--hairline)", borderRight: i % 7 < 6 ? "1px solid var(--hairline)" : "none",
                minHeight: 90, padding: "8px 10px", cursor: "pointer",
                backgroundColor: isToday ? "rgba(31,111,235,0.04)" : "var(--surface)",
                transition: "background-color 100ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--hover)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isToday ? "rgba(31,111,235,0.04)" : "var(--surface)"; }}
            >
              <p style={{ fontSize: "13px", fontWeight: 700, color: isToday ? "#1F6FEB" : "var(--text)", margin: "0 0 6px" }}>
                {d.getDate()}
              </p>
              {dayJobs.slice(0, 3).map(a => (
                <div key={a.id} onClick={e => { e.stopPropagation(); onJobClick(a.booking_id); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, cursor: "pointer" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: a.fp_team_members.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "10px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.bookings.fp_order_number ? `#${a.bookings.fp_order_number}` : a.bookings.full_name}
                  </span>
                </div>
              ))}
              {dayJobs.length > 3 && (
                <p style={{ fontSize: "10px", color: "var(--text-3)", margin: 0 }}>+{dayJobs.length - 3} more</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
