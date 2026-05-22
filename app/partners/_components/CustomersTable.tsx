"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomerDrawer from "./CustomerDrawer";
import NewCustomerDrawer from "./NewCustomerDrawer";

interface Customer {
  email: string;
  full_name: string;
  address: string | null;
  job_count: number;
  last_job_date: string;
  source: string;
  ltv: number;
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function suburb(address: string | null) {
  if (!address) return "—";
  const parts = address.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim() : parts[0].trim();
}

export default function CustomersTable({ customers: initial }: { customers: Customer[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(initial);
  const [search, setSearch] = useState("");
  const [activeEmail, setActiveEmail] = useState<string | null>(searchParams.get("customer"));
  const [newOpen, setNewOpen] = useState(false);

  function openCustomer(email: string) {
    setActiveEmail(email);
    const p = new URLSearchParams(searchParams.toString());
    p.set("customer", email);
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  function closeCustomer() {
    setActiveEmail(null);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("customer");
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  function openJob(id: string) {
    router.push(`/partners?job=${id}`);
  }

  function handleCreated(info: { email: string; full_name: string; address: string }) {
    setNewOpen(false);
    setCustomers(prev => [{
      email: info.email,
      full_name: info.full_name,
      address: info.address || null,
      job_count: 0,
      last_job_date: new Date().toISOString(),
      source: "direct",
      ltv: 0,
    }, ...prev]);
    openCustomer(info.email);
  }

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.address ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={() => setNewOpen(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#111111",
            border: "none",
            borderRadius: 6,
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1, marginTop: -1 }}>+</span>
          New Customer
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search customers by name, email or address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 14px",
            fontSize: "13px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            backgroundColor: "var(--input-bg)",
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", backgroundColor: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--hover)" }}>
              {["Name", "Email", "Suburb", "Jobs", "LTV", "Last Job"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
                  {search ? "No customers match your search." : "No customers yet."}
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr
                  key={c.email}
                  onClick={() => openCustomer(c.email)}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--hairline)" : "none",
                    cursor: "pointer",
                    transition: "background-color 100ms ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--hover)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        backgroundColor: "var(--hover)",
                        border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, color: "#E8A33D", flexShrink: 0,
                      }}>
                        {c.full_name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{c.full_name}</span>
                      {c.source === "direct" && (
                        <span style={{
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                          textTransform: "uppercase", color: "#1F6FEB",
                          backgroundColor: "rgba(31,111,235,0.08)",
                          border: "1px solid rgba(31,111,235,0.2)",
                          borderRadius: 4, padding: "2px 6px",
                          flexShrink: 0,
                        }}>
                          Direct
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: "var(--text-2)" }}>{c.email}</td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: "var(--text-2)" }}>{suburb(c.address)}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: 24, height: 24, borderRadius: 99,
                      backgroundColor: "var(--hover)", border: "1px solid var(--border)",
                      fontSize: "12px", fontWeight: 700, color: "var(--text)", padding: "0 8px",
                    }}>
                      {c.job_count}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                    {c.ltv > 0 ? (
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E7E4A" }}>
                        {fmtCurrency(c.ltv)}
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-3)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: "12px", color: "var(--text-3)", whiteSpace: "nowrap" }}>
                    {fmt(c.last_job_date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomerDrawer
        email={activeEmail}
        onClose={closeCustomer}
        onJobClick={openJob}
        onDeleted={(deletedEmail) => {
          setCustomers(prev => prev.filter(c => c.email.toLowerCase() !== deletedEmail.toLowerCase()));
          closeCustomer();
        }}
      />
      <NewCustomerDrawer open={newOpen} onClose={() => setNewOpen(false)} onCreated={handleCreated} />
    </>
  );
}
