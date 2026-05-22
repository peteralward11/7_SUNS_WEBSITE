"use client";
import { useEffect, useRef, useState } from "react";
import PortalSidebar from "./PortalSidebar";
import MobileBottomNav from "./MobileBottomNav";

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
      {/* Sidebar (desktop only) */}
      <PortalSidebar
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
        newJobCount={newJobCount}
      />

      {/* Main content */}
      <div className="fp-main-content" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {children}
      </div>

      {/* Bottom navigation (mobile only) */}
      <MobileBottomNav
        isAdmin={isAdmin}
        newJobCount={newJobCount}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  );
}
