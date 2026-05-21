"use client";
import { useCallback, useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStatusMeta } from "./PortalShell";
import JobDrawer from "./JobDrawer";
import KanbanBoard from "./KanbanBoard";
import FilterPanel, { DEFAULT_FILTERS, type Filters } from "./FilterPanel";
import BulkActionBar from "./BulkActionBar";

interface Job {
  id: string;
  full_name: string;
  email?: string | null;
  address?: string | null;
  preferred_date?: string | null;
  appliances?: unknown;
  status?: string | null;
  created_at: string;
  project_type?: string | null;
  fp_order_number?: string | null;
}

export default function JobsTable({ jobs: initialJobs, isAdmin }: { jobs: Job[]; isAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs] = useState<Job[]>(initialJobs);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  useEffect(() => {
    setActiveJobId(searchParams.get("job"));
  }, [searchParams]);

  function openJob(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("job", id);
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  function closeJob() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("job");
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  const refresh = useCallback(() => router.refresh(), [router]);

  function getAppliances(job: Job) {
    if (Array.isArray(job.appliances)) return (job.appliances as string[]).join(", ");
    return String(job.appliances ?? "—");
  }

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const q = search.toLowerCase();
      const matchSearch = !q || [j.full_name, j.email, j.address, j.fp_order_number].some(v => v?.toLowerCase().includes(q));
      const matchStatus = filters.statuses.length === 0 || filters.statuses.includes(j.status ?? "pending");
      const matchType =
        filters.projectType === "all" ||
        (filters.projectType === "builder" ? j.project_type === "builder" : j.project_type !== "builder");
      const jobDate = j.preferred_date ?? j.created_at?.slice(0, 10);
      const matchFrom = !filters.dateFrom || jobDate >= filters.dateFrom;
      const matchTo = !filters.dateTo || jobDate <= filters.dateTo;
      return matchSearch && matchStatus && matchType && matchFrom && matchTo;
    });
  }, [jobs, search, filters]);

  const allSelected = filtered.length > 0 && filtered.every(j => selectedIds.includes(j.id));

  function toggleAll() {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map(j => j.id));
  }

  function toggleOne(id: string) {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs…"
            style={{
              width: "100%", padding: "8px 10px 8px 32px",
              border: "1px solid var(--border)", borderRadius: 6,
              fontSize: "13px", backgroundColor: "var(--input-bg)",
              color: "var(--text)", fontFamily: "inherit", outline: "none",
            }}
          />
        </div>

        <FilterPanel filters={filters} onChange={setFilters} />

        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
          {(["table", "kanban"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} title={v.charAt(0).toUpperCase() + v.slice(1)} style={{
              padding: "7px 12px", border: "none",
              backgroundColor: view === v ? "var(--text)" : "transparent",
              color: view === v ? "var(--bg)" : "var(--text-2)",
              cursor: "pointer", transition: "all 150ms ease", display: "flex", alignItems: "center",
            }}>
              {v === "table" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="18" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <span style={{ fontSize: "12px", color: "var(--text-3)", whiteSpace: "nowrap" }}>
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Kanban */}
      {view === "kanban" && <KanbanBoard jobs={filtered} onJobClick={openJob} />}

      {/* Table */}
      {view === "table" && (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-3)" }}>
              <p style={{ fontSize: "14px", margin: 0 }}>No jobs match your search or filters.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--hover)" }}>
                  {isAdmin && (
                    <th style={{ width: 40, padding: "10px 12px" }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
                    </th>
                  )}
                  <Th>Customer</Th>
                  <Th>Order #</Th>
                  <Th>Appliances</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Type</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, i) => {
                  const meta = getStatusMeta(job.status ?? "pending");
                  const isSelected = selectedIds.includes(job.id);

                  return (
                    <tr
                      key={job.id}
                      onClick={() => openJob(job.id)}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--hairline)" : "none",
                        borderLeft: `3px solid ${meta.color}`,
                        cursor: "pointer",
                        backgroundColor: isSelected ? `${meta.color}08` : "transparent",
                        transition: "background-color 100ms ease",
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--hover)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isSelected ? `${meta.color}08` : "transparent"; }}
                    >
                      {isAdmin && (
                        <td style={{ padding: "12px 12px", width: 40 }} onClick={e => { e.stopPropagation(); toggleOne(job.id); }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleOne(job.id)} style={{ cursor: "pointer" }} />
                        </td>
                      )}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{job.full_name}</div>
                        {job.email && <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: 2 }}>{job.email}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                        {job.fp_order_number ? `#${job.fp_order_number}` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-2)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {getAppliances(job)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                        {job.preferred_date ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em",
                          textTransform: "uppercase", color: meta.color,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: meta.color }} />
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "11px", color: "var(--text-3)", textTransform: "capitalize" }}>
                        {job.project_type === "builder" ? "Builder" : "Residential"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <JobDrawer bookingId={activeJobId} isAdmin={isAdmin} onClose={closeJob} />

      {isAdmin && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          onRefresh={refresh}
        />
      )}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-2)" }}>
      {children}
    </th>
  );
}
