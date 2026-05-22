"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";

function NavItem({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link href={href} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 3, textDecoration: "none",
      color: active ? "#E8A33D" : "#5A5A5A",
      position: "relative", padding: "8px 0",
      WebkitTapHighlightColor: "transparent",
    }}>
      {icon}
      <span style={{ fontSize: "10px", fontWeight: active ? 700 : 400, letterSpacing: "0.01em" }}>{label}</span>
      {!!badge && (
        <span style={{
          position: "absolute", top: 4, left: "50%", marginLeft: 6,
          minWidth: 16, height: 16, borderRadius: 99, backgroundColor: "#B44A2C",
          color: "#fff", fontSize: "9px", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
        }}>{badge > 9 ? "9+" : badge}</span>
      )}
    </Link>
  );
}

export default function MobileBottomNav({ isAdmin, newJobCount = 0, userName, userEmail }: {
  isAdmin: boolean;
  newJobCount?: number;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const initials = userName
    ? userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail ? userEmail[0].toUpperCase() : "?";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/partners/login");
  }

  return (
    <>
      <nav className="fp-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 64,
        backgroundColor: "#111111",
        borderTop: "1px solid #2A2A2A",
        display: "none", alignItems: "stretch",
        zIndex: 60,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <NavItem
          href="/partners"
          label="Jobs"
          active={pathname === "/partners"}
          badge={newJobCount}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          }
        />

        {isAdmin ? (
          <>
            <NavItem
              href="/partners/schedule"
              label="Schedule"
              active={pathname.startsWith("/partners/schedule")}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
            <NavItem
              href="/partners/customers"
              label="Customers"
              active={pathname.startsWith("/partners/customers")}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          </>
        ) : (
          <NavItem
            href="/partners/my-schedule"
            label="Schedule"
            active={pathname.startsWith("/partners/my-schedule")}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
        )}

        {/* Profile / More */}
        <button
          onClick={() => setMoreOpen(true)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, border: "none",
            backgroundColor: "transparent", cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            backgroundColor: "#2A2A2A", border: "1.5px solid #3A3A3A",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "#E8A33D",
          }}>
            {initials}
          </div>
          <span style={{ fontSize: "10px", fontWeight: 400, color: "#5A5A5A" }}>More</span>
        </button>
      </nav>

      {/* More bottom sheet */}
      {moreOpen && (
        <>
          <div
            onClick={() => setMoreOpen(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, animation: "fp-fade-in 200ms ease" }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            backgroundColor: "var(--surface)",
            borderRadius: "20px 20px 0 0",
            border: "1px solid var(--border)",
            zIndex: 201,
            animation: "fp-slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)",
            paddingBottom: "env(safe-area-inset-bottom, 16px)",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "var(--border)", margin: "12px auto 4px" }} />
            {/* User info */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#E8A33D", flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{userName ?? userEmail}</div>
                {userName && <div style={{ fontSize: "12px", color: "var(--text-3)" }}>{userEmail}</div>}
              </div>
            </div>
            {/* Actions */}
            <div style={{ padding: "8px 12px" }}>
              <button
                onClick={() => { toggle(); setMoreOpen(false); }}
                style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, backgroundColor: "transparent", border: "none", color: "var(--text)", cursor: "pointer", borderRadius: 10, fontSize: "15px", textAlign: "left" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {theme === "dark"
                    ? <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
                    : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  }
                </svg>
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <button
                onClick={signOut}
                style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, backgroundColor: "transparent", border: "none", color: "#B44A2C", cursor: "pointer", borderRadius: 10, fontSize: "15px", textAlign: "left" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
            <div style={{ height: 8 }} />
          </div>
        </>
      )}
    </>
  );
}
