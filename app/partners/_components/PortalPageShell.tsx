"use client";
import { useEffect, useRef, useState } from "react";
import PortalSidebar from "./PortalSidebar";

interface MiniJob { id: string; created_at: string }

interface PortalPageShellProps {
  children: React.ReactNode;
  jobs: MiniJob[];
  userEmail: string;
  userName?: string | null;
  isAdmin: boolean;
}

export default function PortalPageShell({ children, jobs, userEmail, userName, isAdmin }: PortalPageShellProps) {
  const [newJobCount, setNewJobCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const key = `fp-last-seen-${userEmail}`;
    const lastSeen = localStorage.getItem(key);
    const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date(0);
    const newJobs = jobs.filter(j => new Date(j.created_at) > lastSeenDate);
    setNewJobCount(newJobs.length);
    localStorage.setItem(key, new Date().toISOString());

    // Browser push permission (first load only)
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [userEmail, jobs]);

  // Poll every 60s for new jobs
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const interval = setInterval(async () => {
      try {
        const key = `fp-last-seen-${userEmail}`;
        const lastSeen = localStorage.getItem(key);
        const res = await fetch(`/api/partners/jobs/poll?after=${encodeURIComponent(lastSeen ?? "")}`, { cache: "no-store" });
        if (!res.ok) return;
        const { jobs: newJobs } = await res.json();
        for (const job of newJobs) {
          if (!notifiedRef.current.has(job.id)) {
            notifiedRef.current.add(job.id);
            new Notification("New Job — Fisher & Paykel Portal", {
              body: `${job.full_name} · ${job.address ?? ""}`,
              icon: "/favicon.ico",
            });
          }
        }
      } catch { /* silent */ }
    }, 60000);

    return () => clearInterval(interval);
  }, [userEmail]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      {/* Sidebar (desktop) */}
      <PortalSidebar
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
        newJobCount={newJobCount}
      />

      {/* Mobile top bar */}
      <div
        className="fp-mobile-topbar"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 52,
          backgroundColor: "#111111", zIndex: 60,
          alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          display: "none",
        }}
      >
        <span style={{ fontSize: "11pt", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.06em" }}>
          F&amp;P PORTAL
        </span>
        <button
          onClick={() => setMobileNavOpen(o => !o)}
          style={{ background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", padding: 6 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileNavOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 55, backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileNavOpen(false)}
        >
          <div style={{ width: 240, height: "100%", backgroundColor: "#111111" }} onClick={e => e.stopPropagation()}>
            <PortalSidebar isAdmin={isAdmin} userName={userName} userEmail={userEmail} newJobCount={newJobCount} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="fp-main-content" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
