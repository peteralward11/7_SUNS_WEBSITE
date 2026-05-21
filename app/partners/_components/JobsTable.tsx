"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBadge, getStatusMeta } from "./PortalShell";

type Job = {
  id: string;
  full_name: string;
  address: string;
  appliances: string[] | string | null;
  preferred_date: string | null;
  status: string | null;
  created_at: string;
  project_type: string | null;
  fp_order_number?: string | null;
  email?: string | null;
};

export default function JobsTable({
  jobs: initialJobs,
  isAdmin,
  adminHref,
}: {
  jobs: Job[];
  isAdmin: boolean;
  adminHref?: string;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (
      j.full_name?.toLowerCase().includes(q) ||
      j.address?.toLowerCase().includes(q) ||
      j.fp_order_number?.toLowerCase().includes(q) ||
      (Array.isArray(j.appliances) ? j.appliances.join(" ") : j.appliances ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/partners/bookings/${id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== id));
    setConfirmDelete(null);
    setDeleting(null);
  }

  const detailBase = adminHref ?? "/partners";

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <input
          type="text"
          placeholder="Search by name, address, order number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 400,
            padding: "8px 14px",
            fontSize: "14px",
            border: "1px solid #D9D9D9",
            backgroundColor: "#FFFFFF",
            color: "#111111",
            outline: "none",
          }}
        />
        <span style={{ fontSize: "13px", color: "#7A7A7A" }}>
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table card */}
      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9D9D9" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "#7A7A7A", margin: 0 }}>
              {search ? "No jobs match your search." : "No jobs scheduled. Your next delivery will appear here."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #D9D9D9", backgroundColor: "#F5F5F2" }}>
                  {["Customer", "Order #", "Address", "Appliances", "Preferred Date", "Status", ""].map((h, i) => (
                    <th key={i} style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: "7.5pt",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#5A5A5A",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, i) => {
                  const meta = getStatusMeta(job.status ?? "pending");
                  const appliances = Array.isArray(job.appliances)
                    ? job.appliances.join(", ")
                    : job.appliances ?? "—";
                  const isConfirming = confirmDelete === job.id;

                  return (
                    <tr
                      key={job.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid #EDEDED" : "none",
                        borderLeft: `3px solid ${meta.color}`,
                      }}
                    >
                      <td style={{ padding: "16px 20px", minWidth: 160 }}>
                        <Link href={`${detailBase}/${job.id}`} style={{ textDecoration: "none", color: "#111111", fontSize: "15px", fontWeight: 600, display: "block" }}>
                          {job.full_name}
                        </Link>
                        {job.email && <span style={{ fontSize: "12px", color: "#7A7A7A" }}>{job.email}</span>}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#5A5A5A", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {job.fp_order_number ?? "—"}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#3A3A3A", maxWidth: 180 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.address}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#3A3A3A", maxWidth: 200 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {appliances}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#3A3A3A", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {job.preferred_date ?? "—"}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <StatusBadge status={job.status ?? "pending"} />
                      </td>
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Link
                            href={`${detailBase}/${job.id}`}
                            style={{
                              padding: "5px 14px",
                              border: "1px solid #D9D9D9",
                              color: "#111111",
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              textDecoration: "none",
                              backgroundColor: "#FFFFFF",
                            }}
                          >
                            View
                          </Link>
                          {isAdmin && (
                            isConfirming ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => handleDelete(job.id)}
                                  disabled={deleting === job.id}
                                  style={{
                                    padding: "5px 12px",
                                    backgroundColor: "#B44A2C",
                                    color: "#FFFFFF",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  {deleting === job.id ? "…" : "Confirm"}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  style={{
                                    padding: "5px 10px",
                                    backgroundColor: "transparent",
                                    color: "#5A5A5A",
                                    fontSize: "11px",
                                    border: "1px solid #D9D9D9",
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(job.id)}
                                style={{
                                  padding: "5px 10px",
                                  backgroundColor: "transparent",
                                  color: "#B44A2C",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  border: "1px solid #B44A2C",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
