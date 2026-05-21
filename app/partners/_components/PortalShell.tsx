"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_META: Record<string, { color: string; label: string }> = {
  pending:        { color: "#3F4A5C", label: "Pending" },
  quoted:         { color: "#1F6FEB", label: "Quoted" },
  confirmed:      { color: "#1F6FEB", label: "Confirmed" },
  scheduled:      { color: "#3F4A5C", label: "Scheduled" },
  "in progress":  { color: "#1F6FEB", label: "In Progress" },
  completed:      { color: "#1E7E4A", label: "Completed" },
  paid:           { color: "#1E7E4A", label: "Paid" },
  issue:          { color: "#B44A2C", label: "Issue" },
};

export function getStatusMeta(status: string) {
  return STATUS_META[status?.toLowerCase()] ?? { color: "#7A7A7A", label: status ?? "Pending" };
}

export function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: meta.color, flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: "#3A3A3A" }}>{meta.label}</span>
    </span>
  );
}

export function MetricCard({
  label, value, sub, accentColor
}: {
  label: string; value: string | number; sub?: string; accentColor?: string;
}) {
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #D9D9D9",
      borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid #D9D9D9",
      padding: "24px 28px",
      flex: "1 1 0",
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 12px" }}>
        {label}
      </p>
      <p style={{ fontSize: "36px", fontWeight: 700, color: "#111111", margin: 0, lineHeight: 1, letterSpacing: "-0.01em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "12px", color: "#7A7A7A", margin: "8px 0 0" }}>{sub}</p>}
    </div>
  );
}

export function PortalSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/partners/login");
  }

  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      backgroundColor: "#111111",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid #2A2A2A" }}>
        <div style={{ fontSize: "13pt", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.06em", lineHeight: 1.1 }}>
          FISHER &amp; PAYKEL
        </div>
        <div style={{ fontSize: "8pt", color: "#5A5A5A", letterSpacing: "0.04em", marginTop: 4 }}>
          Delivery Portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        <SidebarLink href="/partners" label="Jobs" active={pathname === "/partners"} icon="📦" />
        {isAdmin && (
          <SidebarLink href="/partners/admin" label="Admin" active={pathname.startsWith("/partners/admin")} icon="⚙️" />
        )}
      </nav>

      {/* Bottom — 7Suns + sign out */}
      <div style={{ borderTop: "1px solid #2A2A2A", padding: "20px 24px" }}>
        <button
          onClick={handleSignOut}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 0",
            backgroundColor: "transparent",
            color: "#7A7A7A",
            fontSize: "13px",
            textAlign: "left",
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
            letterSpacing: "0.02em",
          }}
        >
          Sign out →
        </button>
        <div style={{ fontSize: "10pt", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em" }}>7SUNS</div>
        <div style={{ fontSize: "7.5pt", color: "#5A5A5A", letterSpacing: "0.04em", marginTop: 2 }}>
          DELIVERY &amp; INSTALLATION PARTNER
        </div>
        <div style={{ height: "1.8px", backgroundColor: "#E8A33D", marginTop: 6, width: "100%" }} />
      </div>
    </aside>
  );
}

function SidebarLink({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 24px",
        color: active ? "#FFFFFF" : "#7A7A7A",
        fontSize: "14px",
        fontWeight: active ? 600 : 400,
        textDecoration: "none",
        backgroundColor: active ? "#1E1E1E" : "transparent",
        borderLeft: active ? "2px solid #FFFFFF" : "2px solid transparent",
        transition: "color 200ms ease",
      }}
    >
      <span style={{ fontSize: "14px" }}>{icon}</span>
      {label}
    </Link>
  );
}

export function PortalFooter() {
  return (
    <footer style={{ borderTop: "1px solid #EDEDED", padding: "14px 40px", backgroundColor: "#FFFFFF" }}>
      <p style={{ fontSize: "8.5pt", color: "#B8B8B8", margin: 0 }}>
        © Fisher &amp; Paykel Appliances Ltd · Delivery &amp; installation by 7suns, an authorised Fisher &amp; Paykel partner. Engineered for Life. Est. 1934.
      </p>
    </footer>
  );
}
