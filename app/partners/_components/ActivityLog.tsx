"use client";
import { useEffect, useRef, useState } from "react";

interface ActivityEntry {
  id: string;
  user_name: string | null;
  user_email: string | null;
  type: string;
  content: string;
  created_at: string;
}

export default function ActivityLog({ bookingId }: { bookingId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/partners/activity?booking_id=${bookingId}`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []));
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  async function postNote() {
    if (!note.trim() || posting) return;
    setPosting(true);
    const optimistic: ActivityEntry = {
      id: Math.random().toString(),
      user_name: "You",
      user_email: null,
      type: "note",
      content: note.trim(),
      created_at: new Date().toISOString(),
    };
    setEntries(e => [...e, optimistic]);
    setNote("");
    const res = await fetch("/api/partners/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, content: note.trim() }),
    });
    const data = await res.json();
    if (data.entry) {
      setEntries(e => e.map(x => x.id === optimistic.id ? data.entry : x));
    }
    setPosting(false);
  }

  return (
    <div>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 12px" }}>
        Activity Log
      </p>

      <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
        {entries.length === 0 && (
          <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>No activity yet.</p>
        )}
        {entries.map(e => (
          <div key={e.id} style={{ display: "flex", gap: 10 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: e.type === "status_change" ? "#1F6FEB22" : "var(--hover)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: e.type === "status_change" ? "#1F6FEB" : "var(--text-2)",
              flexShrink: 0,
            }}>
              {(e.user_name ?? e.user_email ?? "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
                  {e.user_name ?? e.user_email ?? "System"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                  {formatTime(e.created_at)}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "2px 0 0", lineHeight: 1.4 }}>
                {e.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Note input */}
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postNote();
          }}
          placeholder="Add a note…"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: "13px",
            backgroundColor: "var(--input-bg)",
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          onClick={postNote}
          disabled={!note.trim() || posting}
          style={{
            alignSelf: "flex-end",
            padding: "8px 16px",
            backgroundColor: posting || !note.trim() ? "var(--border)" : "#111111",
            color: posting || !note.trim() ? "var(--text-3)" : "#FFFFFF",
            border: "none",
            borderRadius: 6,
            fontSize: "12px",
            fontWeight: 600,
            cursor: posting || !note.trim() ? "default" : "pointer",
            transition: "background-color 150ms ease",
          }}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
