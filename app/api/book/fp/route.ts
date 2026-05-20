import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GHL_BASE = "https://services.leadconnectorhq.com";

const ALL_BOOKING_TAGS = ["booking-residential", "booking-builder", "fisher-paykel", "contact-inquiry"];

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

async function upsertGHLContact(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1?: string;
  tags: string[];
  customFields?: { key: string; field_value: string }[];
}) {
  try {
    const headers = ghlHeaders();

    /* ── 1. Search for existing contact by email ── */
    const searchRes = await fetch(
      `${GHL_BASE}/contacts/?locationId=${process.env.GHL_LOCATION_ID}&query=${encodeURIComponent(payload.email)}`,
      { headers }
    );
    const searchData = await searchRes.json();
    const existing = searchData?.contacts?.[0];

    if (existing) {
      const id = existing.id;

      /* ── 2a. Update contact details & custom fields first ── */
      await fetch(`${GHL_BASE}/contacts/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          address1: payload.address1,
          customFields: payload.customFields,
        }),
      });

      /* ── 2b. Remove old booking tags ── */
      await fetch(`${GHL_BASE}/contacts/${id}/tags`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ tags: ALL_BOOKING_TAGS }),
      });

      /* ── 2c. Add new tag last (triggers "Tag Added" workflow after fields are set) ── */
      await fetch(`${GHL_BASE}/contacts/${id}/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tags: payload.tags }),
      });
    } else {
      /* ── 3. Create new contact ── */
      await fetch(`${GHL_BASE}/contacts/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          locationId: process.env.GHL_LOCATION_ID,
          ...payload,
        }),
      });
    }
  } catch (err) {
    console.error("[book/fp] GHL error:", err);
  }
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  try {
    const body = await req.json();
    const {
      full_name, email, phone, fp_order_number,
      project_type,
      company_name, site_contact_name, site_contact_phone,
      address, suite_number, floor_number, unit_count,
      appliance_entries,
      installation, removal, elevator, stair_carry,
      access_notes,
      preferred_date, alternate_date,
      time_window, notes,
    } = body;

    /* ── 1. Validate required fields ── */
    if (!full_name || !email || !phone || !fp_order_number || !address || !appliance_entries?.length || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (project_type === "builder" && !company_name) {
      return NextResponse.json({ error: "Company name required for builder bookings" }, { status: 400 });
    }

    /* ── 2. Serialize appliance entries ── */
    const appliances: string[] = (appliance_entries as { type: string; type_other?: string }[]).map(e =>
      e.type === "Other" && e.type_other ? `Other: ${e.type_other}` : e.type
    );

    const data = {
      full_name, email, phone,
      address,
      suite_number: suite_number || null,
      floor_number: floor_number || null,
      appliances,
      installation: Boolean(installation),
      removal: Boolean(removal),
      elevator: Boolean(elevator),
      stair_carry: Boolean(stair_carry),
      access_notes: access_notes || null,
      project_type: project_type ?? "residential",
      company_name: company_name || null,
      unit_count: unit_count || null,
      site_contact_name: site_contact_name || null,
      site_contact_phone: site_contact_phone || null,
      preferred_date,
      alternate_date: alternate_date || null,
      time_window: time_window || null,
      notes: notes || null,
      source: "fisher_paykel",
      fp_order_number,
    };

    /* ── 3. Save to Supabase ── */
    const { error: dbError } = await supabase.from("bookings").insert(data);
    if (dbError) {
      console.error("[book/fp] Supabase insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    /* ── 4. Upsert contact in GoHighLevel ── */
    const nameParts = full_name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    await upsertGHLContact({
      firstName,
      lastName,
      email,
      phone,
      address1: address,
      tags: ["fisher-paykel"],
      customFields: [
        { key: "fp_order_number", field_value: fp_order_number },
        { key: "preferred_date", field_value: preferred_date },
        { key: "appliances", field_value: appliances.join(", ") },
        { key: "installation", field_value: installation ? "Yes" : "No" },
        { key: "removal", field_value: removal ? "Yes" : "No" },
        { key: "elevator", field_value: elevator ? "Yes" : "No" },
        { key: "stair_carry", field_value: stair_carry ? "Yes" : "No" },
        { key: "project_type", field_value: project_type ?? "residential" },
        ...(suite_number ? [{ key: "suite_number", field_value: suite_number }] : []),
        ...(floor_number ? [{ key: "floor_number", field_value: floor_number }] : []),
        ...(alternate_date ? [{ key: "alternate_date", field_value: alternate_date }] : []),
        ...(time_window ? [{ key: "time_window", field_value: time_window }] : []),
        ...(access_notes ? [{ key: "access_notes", field_value: access_notes }] : []),
        ...(company_name ? [{ key: "company_name", field_value: company_name }] : []),
        ...(site_contact_name ? [{ key: "site_contact_name", field_value: site_contact_name }] : []),
        ...(site_contact_phone ? [{ key: "site_contact_phone", field_value: site_contact_phone }] : []),
        ...(unit_count ? [{ key: "unit_count", field_value: String(unit_count) }] : []),
        ...(notes ? [{ key: "notes", field_value: notes }] : []),
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[book/fp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
