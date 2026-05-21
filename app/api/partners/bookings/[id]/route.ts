import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "quoted", "confirmed", "scheduled", "in progress", "completed", "paid"];
const GHL_BASE = "https://services.leadconnectorhq.com";

async function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

async function ghlTagContact(email: string, tag: string) {
  try {
    const headers = await ghlHeaders();
    const searchRes = await fetch(
      `${GHL_BASE}/contacts/?locationId=${process.env.GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`,
      { headers }
    );
    const searchData = await searchRes.json();
    const contact = searchData?.contacts?.find(
      (c: { email?: string }) => c.email?.toLowerCase() === email.toLowerCase()
    );
    if (!contact) return;

    await fetch(`${GHL_BASE}/contacts/${contact.id}/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tags: [tag] }),
    });
  } catch (err) {
    console.error("[GHL tag] error:", err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: portalUser } = await supabase
      .from("fp_portal_users")
      .select("is_admin, name")
      .eq("email", user.email ?? "")
      .single();

    if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { status } = await req.json();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch booking for email + old status
    const { data: booking } = await supabase
      .from("bookings")
      .select("email, status, full_name")
      .eq("id", id)
      .eq("source", "fisher_paykel")
      .single();

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .eq("source", "fisher_paykel");

    if (error) {
      console.error("[partners/bookings] update error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Log status change to activity feed
    const oldStatus = booking?.status ?? "pending";
    if (oldStatus !== status) {
      await supabase.from("fp_job_activity").insert({
        booking_id: id,
        user_email: user.email,
        user_name: portalUser.name ?? user.email,
        type: "status_change",
        content: `Status changed from "${oldStatus}" to "${status}"`,
      });
    }

    // GHL auto-tag
    if (booking?.email) {
      if (status === "scheduled") {
        ghlTagContact(booking.email, "job-scheduled").catch(() => {});
      } else if (status === "completed") {
        ghlTagContact(booking.email, "job-completed").catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[partners/bookings] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: portalUser } = await supabase
      .from("fp_portal_users")
      .select("is_admin")
      .eq("email", user.email ?? "")
      .single();

    if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("source", "fisher_paykel");

    if (error) {
      console.error("[partners/bookings] delete error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[partners/bookings] delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
