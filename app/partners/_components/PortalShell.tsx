"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  pending:     "#3F4A5C",
  quoted:      "#1F6FEB",
  confirmed:   "#1F6FEB",
  scheduled:   "#3F4A5C",
  "in progress": "#1F6FEB",
  completed:   "#1E7E4A",
  paid:        "#1E7E4A",
  issue:       "#B44A2C",
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status?.toLowerCase()] ?? "#7A7A7A";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: "#3A3A3A", textTransform: "capitalize" }}>{status ?? "—"}</span>
    </span>
  );
}

export function PortalHeader({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const inAdmin = pathname.startsWith("/partners/admin");

  return (
    <header style={{
      backgroundColor: "#111111",
      borderBottom: "1px solid #3A3A3A",
      padding: "0 40px",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-between",
      minHeight: 56,
    }}>
      {/* Left — F&P brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <Link href="/partners" style={{ textDecoration: "none" }}>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: "12pt", fontWeight: 700, letterSpacing: "0.06em", lineHeight: 1 }}>
              FISHER &amp; PAYKEL
            </div>
            <div style={{ color: "#7A7A7A", fontSize: "8.5pt", letterSpacing: "0.03em", marginTop: 2 }}>
              Friends &amp; Family Delivery Portal
            </div>
          </div>
        </Link>

        {isAdmin && (
          <nav style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            <NavTab href="/partners" label="Jobs" active={pathname === "/partners"} />
            <NavTab href="/partners/admin" label="Admin" active={inAdmin} />
          </nav>
        )}
      </div>

      {/* Right — 7 Suns */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#FFFFFF", fontSize: "10pt", fontWeight: 700, letterSpacing: "0.04em", lineHeight: 1 }}>
            7SUNS
          </div>
          <div style={{ color: "#B8B8B8", fontSize: "7.5pt", letterSpacing: "0.04em", marginTop: 2 }}>
            DELIVERY &amp; INSTALLATION PARTNER
          </div>
          <div style={{ height: "1.8px", backgroundColor: "#E8A33D", marginTop: 3 }} />
        </div>
      </div>
    </header>
  );
}

function NavTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        color: active ? "#FFFFFF" : "#7A7A7A",
        fontSize: "13px",
        fontWeight: active ? 700 : 400,
        textDecoration: "none",
        borderBottom: active ? "2px solid #FFFFFF" : "2px solid transparent",
        transition: "color 200ms ease",
      }}
    >
      {label}
    </Link>
  );
}

export function PortalFooter() {
  return (
    <footer style={{
      borderTop: "1px solid #EDEDED",
      padding: "16px 40px",
      textAlign: "center",
      backgroundColor: "#FFFFFF",
    }}>
      <p style={{ fontSize: "8.5pt", color: "#5A5A5A", margin: 0 }}>
        © Fisher &amp; Paykel Appliances Ltd · Delivery &amp; installation by 7suns, an authorised Fisher &amp; Paykel partner. Engineered for Life. Est. 1934.
      </p>
    </footer>
  );
}

export function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #D9D9D9",
      padding: "24px 28px",
      flex: "1 1 180px",
    }}>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: "36px", fontWeight: 700, color: "#111111", margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "8.5pt", color: "#7A7A7A", margin: "6px 0 0" }}>{sub}</p>
      )}
    </div>
  );
}
