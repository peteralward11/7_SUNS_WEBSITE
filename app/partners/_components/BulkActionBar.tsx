"use client";
import { useState } from "react";
import { getStatusMeta } from "./PortalShell";

const STATUSES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  onRefresh: () => void;
  onDelete: (ids: string[]) => void;
}

export default function BulkActionBar({ selectedIds, onClear, onRefresh, onDelete }: BulkActionBarProps) {
  const [bulkStatus, setBulkStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedIds.length === 0) return null;

  async function applyStatus() {
    if (!bulkStatus || loading) return;
    setLoading(true);
    await Promise.all(
      selectedIds.map(id =>
        fetch(`/api/partners/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus }),
        })
      )
    );
    setLoading(false);
    onClear();
    onRefresh();
  }

  async function bulkDelete() {
    setLoading(true);
    const ids = [...selectedIds];
    await Promise.all(
      ids.map(id =>
        fetch(`/api/partners/bookings/${id}`, { method: "DELETE" })
      )
    );
    setLoading(false);
    setConfirmDelete(false);
    onDelete(ids);
    onClear();
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 70,
      backgroundColor: "var(--text)",
      color: "var(--bg)",
      borderRadius: 12,
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 600 }}>
        {selectedIds.length} selected
      </span>

      <div style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.2)" }} />

      {/* Status select */}
      <select
        value={bulkStatus}
        onChange={e => setBulkStatus(e.target.value)}
        style={{
          padding: "5px 8px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.2)",
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "var(--bg)",
          fontSize: "12px",
          cursor: "pointer",
          fontFamily: "inherit",
          outline: "none",
        }}
      >
        <option value="">Set status…</option>
        {STATUSES.map(s => (
          <option key={s} value={s}>{getStatusMeta(s).label}</option>
        ))}
      </select>

      <button
        onClick={applyStatus}
        disabled={!bulkStatus || loading}
        style={{
          padding: "6px 14px",
          backgroundColor: !bulkStatus || loading ? "rgba(255,255,255,0.15)" : "#1E7E4A",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 6,
          fontSize: "12px",
          fontWeight: 600,
          cursor: !bulkStatus || loading ? "default" : "pointer",
        }}
      >
        {loading ? "Applying…" : "Apply"}
      </button>

      <div style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.2)" }} />

      {/* Delete */}
      {confirmDelete ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "12px" }}>Delete {selectedIds.length}?</span>
          <button onClick={bulkDelete} disabled={loading} style={{ padding: "5px 12px", backgroundColor: "#B44A2C", color: "#FFFFFF", border: "none", borderRadius: 6, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Yes
          </button>
          <button onClick={() => setConfirmDelete(false)} style={{ padding: "5px 12px", backgroundColor: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: "12px", cursor: "pointer" }}>
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            padding: "6px 14px",
            backgroundColor: "transparent",
            color: "#FF6B6B",
            border: "1px solid rgba(255,107,107,0.4)",
            borderRadius: 6,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      )}

      <button
        onClick={onClear}
        style={{
          padding: "6px",
          backgroundColor: "transparent",
          color: "rgba(255,255,255,0.5)",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}
