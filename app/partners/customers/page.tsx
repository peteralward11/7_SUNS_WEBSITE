import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalFooter } from "../_components/PortalShell";
import PortalPageShell from "../_components/PortalPageShell";
import CustomersTable from "../_components/CustomersTable";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partners/login");

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin, name")
    .eq("email", user.email ?? "")
    .single();

  if (!portalUser?.is_admin) redirect("/partners");

  const [bookingsRes, invoicesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, full_name, email, address, preferred_date, status, created_at, archived, source")
      .in("source", ["fisher_paykel", "direct"])
      .order("created_at", { ascending: false }),
    supabase
      .from("fp_invoices")
      .select("booking_id, amount")
      .eq("status", "paid"),
  ]);

  const bookings = bookingsRes.data ?? [];

  // Build booking_id → paid amount map
  const paidByBooking = new Map<string, number>();
  for (const inv of invoicesRes.data ?? []) {
    paidByBooking.set(inv.booking_id, (paidByBooking.get(inv.booking_id) ?? 0) + Number(inv.amount));
  }

  // Group into customers by email
  const map = new Map<string, {
    email: string;
    full_name: string;
    address: string | null;
    job_count: number;
    last_job_date: string;
    source: string;
    ltv: number;
  }>();

  for (const b of bookings) {
    const key = (b.email ?? "").toLowerCase();
    if (!key) continue;
    const paid = paidByBooking.get(b.id) ?? 0;
    const existing = map.get(key);
    if (existing) {
      if (b.status !== "contact") existing.job_count++;
      existing.ltv += paid;
      if (b.created_at > existing.last_job_date) {
        existing.last_job_date = b.created_at;
        existing.full_name = b.full_name ?? existing.full_name;
        existing.source = b.source ?? existing.source;
      }
    } else {
      map.set(key, {
        email: b.email ?? key,
        full_name: b.full_name ?? "",
        address: b.address ?? null,
        job_count: b.status === "contact" ? 0 : 1,
        last_job_date: b.created_at,
        source: b.source ?? "fisher_paykel",
        ltv: paid,
      });
    }
  }

  const customers = Array.from(map.values()).sort((a, b) => b.last_job_date.localeCompare(a.last_job_date));

  const miniJobs = (bookings ?? []).map(j => ({ id: j.id, created_at: j.created_at }));

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user.email ?? ""} userName={portalUser.name} isAdmin={true}>
      <div style={{ padding: "36px 40px 24px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          Fisher &amp; Paykel
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.2 }}>
          Customers
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>
          {customers.length} unique customer{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div style={{ padding: "0 40px 40px", flex: 1 }}>
        <CustomersTable customers={customers} />
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
