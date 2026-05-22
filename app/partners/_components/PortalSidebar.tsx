"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";

function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface SidebarProps {
  isAdmin: boolean;
  userName?: string | null;
  userEmail?: string | null;
  newJobCount?: number;
}

export default function PortalSidebar({ isAdmin, userName, userEmail, newJobCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fp-sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem("fp-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/partners/login");
  }

  const initials = userName
    ? userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail
    ? userEmail[0].toUpperCase()
    : "?";

  const w = collapsed ? 64 : 240;

  return (
    <aside
      className="fp-sidebar"
      style={{
        width: w,
        minWidth: w,
        backgroundColor: "#111111",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 220ms cubic-bezier(0.16, 1, 0.3, 1), min-width 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 40,
      }}
    >
      {/* Logo + collapse toggle */}
      <div style={{
        padding: collapsed ? "24px 0" : "28px 24px 24px",
        borderBottom: "1px solid #2A2A2A",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        transition: "padding 220ms ease",
      }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: "12pt", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.06em", lineHeight: 1.1 }}>
              FISHER &amp; PAYKEL
            </div>
            <div style={{ fontSize: "7.5pt", color: "#5A5A5A", letterSpacing: "0.04em", marginTop: 3 }}>
              Delivery Portal
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #2A2A2A",
            color: "#7A7A7A",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            flexShrink: 0,
            transition: "color 150ms ease",
          }}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {isAdmin && (
          <>
            {!collapsed && (
              <p style={{ fontSize: "7pt", fontWeight: 700, letterSpacing: "0.1em", color: "#3A3A3A", textTransform: "uppercase", margin: "8px 20px 4px", userSelect: "none" }}>
                Admin
              </p>
            )}
            <NavLink
              href="/partners/admin"
              label="Dashboard"
              icon={<IconSettings />}
              active={pathname === "/partners/admin"}
              collapsed={collapsed}
            />
            <NavLink
              href="/partners/reports"
              label="Reports"
              icon={<IconBarChart />}
              active={pathname === "/partners/reports"}
              collapsed={collapsed}
            />
            <div style={{ height: "1px", backgroundColor: "#1E1E1E", margin: collapsed ? "8px 12px" : "8px 20px" }} />
          </>
        )}
        {!collapsed && (
          <p style={{ fontSize: "7pt", fontWeight: 700, letterSpacing: "0.1em", color: "#3A3A3A", textTransform: "uppercase", margin: "8px 20px 4px", userSelect: "none" }}>
            Jobs
          </p>
        )}
        <NavLink
          href="/partners"
          label="All Jobs"
          icon={<IconBriefcase />}
          active={pathname === "/partners"}
          collapsed={collapsed}
          badge={newJobCount > 0 ? newJobCount : undefined}
        />
        {isAdmin && (
          <>
            <div style={{ height: "1px", backgroundColor: "#1E1E1E", margin: collapsed ? "8px 12px" : "8px 20px" }} />
            {!collapsed && (
              <p style={{ fontSize: "7pt", fontWeight: 700, letterSpacing: "0.1em", color: "#3A3A3A", textTransform: "uppercase", margin: "8px 20px 4px", userSelect: "none" }}>
                Customers
              </p>
            )}
            <NavLink
              href="/partners/customers"
              label="All Customers"
              icon={<IconUsers />}
              active={pathname.startsWith("/partners/customers")}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #2A2A2A", padding: collapsed ? "16px 0" : "16px 20px" }}>
        {/* Avatar + name */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "#2A2A2A",
            border: "1px solid #3A3A3A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            color: "#E8A33D",
            flexShrink: 0,
            letterSpacing: "0.04em",
          }}>
            {initials}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName ?? userEmail ?? ""}
              </div>
              {userName && (
                <div style={{ fontSize: "11px", color: "#5A5A5A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userEmail}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark mode + sign out */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 8 }}>
          <button
            onClick={toggle}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#5A5A5A",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              borderRadius: 6,
              transition: "color 150ms ease",
            }}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          {!collapsed && (
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#5A5A5A",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: 6,
                borderRadius: 6,
                fontSize: "12px",
                transition: "color 150ms ease",
              }}
            >
              <IconLogOut />
              Sign out
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#5A5A5A",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                borderRadius: 6,
                transition: "color 150ms ease",
              }}
            >
              <IconLogOut />
            </button>
          )}
        </div>

        {/* 7Suns branding */}
        {!collapsed && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #1E1E1E" }}>
            <div style={{ fontSize: "9pt", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.06em" }}>7SUNS</div>
            <div style={{ fontSize: "7pt", color: "#5A5A5A", letterSpacing: "0.04em", marginTop: 2 }}>
              DELIVERY &amp; INSTALLATION PARTNER
            </div>
            <div style={{ height: "1.5px", backgroundColor: "#E8A33D", marginTop: 6, width: "100%" }} />
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({
  href, label, icon, active, collapsed, badge
}: {
  href: string; label: string; icon: React.ReactNode; active: boolean; collapsed: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        padding: collapsed ? "10px 0" : "10px 20px",
        justifyContent: collapsed ? "center" : "flex-start",
        color: active ? "#FFFFFF" : "#7A7A7A",
        fontSize: "14px",
        fontWeight: active ? 600 : 400,
        textDecoration: "none",
        backgroundColor: active ? "#1A1A1A" : "transparent",
        borderLeft: active ? "2px solid #E8A33D" : "2px solid transparent",
        position: "relative",
        transition: "color 150ms ease, background-color 150ms ease",
      }}
    >
      <span style={{ position: "relative", flexShrink: 0 }}>
        {icon}
        {badge !== undefined && (
          <span style={{
            position: "absolute",
            top: -5,
            right: -5,
            backgroundColor: "#B44A2C",
            color: "#FFFFFF",
            fontSize: "9px",
            fontWeight: 700,
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          }}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {!collapsed && label}
      {!collapsed && badge !== undefined && (
        <span style={{
          marginLeft: "auto",
          backgroundColor: "#B44A2C",
          color: "#FFFFFF",
          fontSize: "10px",
          fontWeight: 700,
          borderRadius: 99,
          padding: "2px 7px",
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
