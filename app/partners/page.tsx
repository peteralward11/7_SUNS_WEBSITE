import { createClient } from "@/lib/supabase/server";
import { PortalFooter } from "./_components/PortalShell";
import JobsTable from "./_components/JobsTable";
import PortalPageShell from "./_components/PortalPageShell";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function PartnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [portalUserRes, bookingsRes] = await Promise.all([
    supabase
      .from("fp_portal_users")
      .select("is_admin, name")
      .eq("email", user?.email ?? "")
      .single(),
    supabase
      .from("bookings")
      .select("id, full_name, email, address, preferred_date, appliances, status, created_at, project_type, fp_order_number, archived")
      .eq("source", "fisher_paykel")
      .order("created_at", { ascending: false }),
  ]);

  const portalUser = portalUserRes.data;
  const isAdmin = portalUser?.is_admin ?? false;
  const firstName = portalUser?.name?.split(" ")[0] ?? null;
  const bookings = bookingsRes.data;

  const jobs = bookings ?? [];
  const pending = jobs.filter(j => (j.status ?? "pending") === "pending").length;
  const miniJobs = jobs.map(j => ({ id: j.id, created_at: j.created_at }));

  return (
    <PortalPageShell jobs={miniJobs} userEmail={user?.email ?? ""} userName={portalUser?.name} isAdmin={isAdmin}>
      <div style={{ padding: "36px 40px 24px" }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 6px" }}>
          Fisher &amp; Paykel
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.2 }}>
          {firstName ? `${getGreeting()}, ${firstName}.` : "Delivery Jobs"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>
          {jobs.length} total job{jobs.length !== 1 ? "s" : ""}
          {pending > 0 ? ` · ${pending} pending` : ""}
        </p>
      </div>

      <div style={{ padding: "0 40px 40px", flex: 1 }}>
        <Suspense>
          <JobsTable jobs={jobs} isAdmin={isAdmin} />
        </Suspense>
      </div>

      <PortalFooter />
    </PortalPageShell>
  );
}
