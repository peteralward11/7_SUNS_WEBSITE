import { NextRequest, NextResponse } from "next/server";

const GHL_BASE = "https://services.leadconnectorhq.com";

const ALL_BOOKING_TAGS = ["booking-residential", "booking-builder", "fisher-paykel", "contact-inquiry"];

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, inquiry, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";
    const headers = ghlHeaders();

    try {
      /* ── 1. Search for existing contact by email ── */
      const searchRes = await fetch(
        `${GHL_BASE}/contacts/?locationId=${process.env.GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`,
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
            firstName,
            lastName,
            phone: phone || undefined,
            customFields: [
              { key: "inquiry_type", field_value: inquiry || "General" },
              { key: "message", field_value: message },
            ],
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
          body: JSON.stringify({ tags: ["contact-inquiry"] }),
        });
      } else {
        /* ── 3. Create new contact ── */
        await fetch(`${GHL_BASE}/contacts/`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            locationId: process.env.GHL_LOCATION_ID,
            firstName,
            lastName,
            email,
            phone: phone || undefined,
            tags: ["contact-inquiry"],
            customFields: [
              { key: "inquiry_type", field_value: inquiry || "General" },
              { key: "message", field_value: message },
            ],
          }),
        });
      }
    } catch (err) {
      console.error("[contact] GHL error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
