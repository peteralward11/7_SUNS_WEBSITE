import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const HCP_BASE = "https://api.housecallpro.com";
const GHL_BASE = "https://services.leadconnectorhq.com";

const ALL_BOOKING_TAGS = ["booking-residential", "booking-builder", "fisher-paykel", "contact-inquiry"];

async function ghlHeaders() {
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
    const headers = await ghlHeaders();

    /* ── 1. Search for existing contact by email ── */
    const searchRes = await fetch(
      `${GHL_BASE}/contacts/?locationId=${process.env.GHL_LOCATION_ID}&query=${encodeURIComponent(payload.email)}`,
      { headers }
    );
    const searchData = await searchRes.json();
    const existing = searchData?.contacts?.[0];

    if (existing) {
      const id = existing.id;

      /* ── 2a. Remove old booking tags ── */
      await fetch(`${GHL_BASE}/contacts/${id}/tags`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ tags: ALL_BOOKING_TAGS }),
      });

      /* ── 2b. Add new tag (triggers "Tag Added" workflow) ── */
      await fetch(`${GHL_BASE}/contacts/${id}/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tags: payload.tags }),
      });

      /* ── 2c. Update contact details & custom fields ── */
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
    console.error("[book] GHL error:", err);
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
      full_name, email, phone,
      project_type,
      company_name,
      appliance_count,
      address,
      unit_count,
      appliances,
      installation,
      removal,
      elevator,
      stair_carry,
      preferred_date,
      access_notes,
      notes,
    } = body;

    /* ── 1. Validate required fields ── */
    const isBuilder = project_type === "builder";
    if (!full_name || !email || !phone || !address || !appliances?.length || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (isBuilder && !company_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = {
      full_name,
      email,
      phone,
      project_type: project_type ?? "residential",
      company_name: company_name || null,
      appliance_count: appliance_count ?? null,
      address,
      unit_count: unit_count ?? null,
      appliances,
      installation: Boolean(installation),
      removal: Boolean(removal),
      elevator: Boolean(elevator),
      stair_carry: Boolean(stair_carry),
      preferred_date,
      access_notes: access_notes || null,
      notes: notes || null,
    };

    /* ── 2. Save to Supabase ── */
    const { error: dbError } = await supabase.from("bookings").insert(data);
    if (dbError) {
      console.error("[book] Supabase insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    /* ── 3. Upsert contact in GoHighLevel ── */
    const nameParts = full_name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";
    const tag = isBuilder ? "booking-builder" : "booking-residential";

    await upsertGHLContact({
      firstName,
      lastName,
      email,
      phone,
      address1: address,
      tags: [tag],
      customFields: [
        { key: "preferred_date", field_value: preferred_date },
        { key: "appliances", field_value: Array.isArray(appliances) ? appliances.join(", ") : appliances },
        ...(company_name ? [{ key: "company_name", field_value: company_name }] : []),
        ...(notes ? [{ key: "notes", field_value: notes }] : []),
        ...(access_notes ? [{ key: "access_notes", field_value: access_notes }] : []),
      ],
    });

    /* ── 4. HousecallPro integration ── */
    try {
      const hcpHeaders = {
        Authorization: `Token ${process.env.HOUSECALL_PRO_API_KEY}`,
        "Content-Type": "application/json",
      };

      const customerRes = await fetch(`${HCP_BASE}/customers`, {
        method: "POST",
        headers: hcpHeaders,
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, mobile_number: phone }),
      });
      const customer = await customerRes.json();

      const appliancesList = Array.isArray(appliances) ? appliances.join(", ") : appliances;
      const description = [
        `Appliances: ${appliancesList}`,
        appliance_count ? `Number of Appliances: ${appliance_count}` : null,
        unit_count ? `Number of Units: ${unit_count}` : null,
        `Installation: ${installation ? "Yes" : "No"}`,
        `Old Unit Removal: ${removal ? "Yes" : "No"}`,
        `Elevator Required: ${elevator ? "Yes" : "No"}`,
        `Stair Carry: ${stair_carry ? "Yes" : "No"}`,
        `Project Type: ${isBuilder ? "Builder/Commercial" : "Residential"}`,
        isBuilder && company_name ? `Company: ${company_name}` : null,
        `Preferred Date: ${preferred_date}`,
        access_notes ? `Access Notes: ${access_notes}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join("\n");

      await fetch(`${HCP_BASE}/jobs`, {
        method: "POST",
        headers: hcpHeaders,
        body: JSON.stringify({
          customer_id: customer.id,
          address: { street: address },
          description,
          lead_source: "Website",
        }),
      });
    } catch (hcpErr) {
      console.error("[book] HousecallPro error:", hcpErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[book] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
