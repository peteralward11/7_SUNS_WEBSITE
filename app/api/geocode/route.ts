import { NextRequest, NextResponse } from "next/server";

const PROVINCE_ABBR: Record<string, string> = {
  "Ontario": "ON", "Quebec": "QC", "British Columbia": "BC",
  "Alberta": "AB", "Manitoba": "MB", "Saskatchewan": "SK",
  "Nova Scotia": "NS", "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL", "Prince Edward Island": "PE",
  "Northwest Territories": "NT", "Nunavut": "NU", "Yukon": "YT",
};

interface NomResult {
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
}

function fmt(r: NomResult): string {
  const a = r.address;
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
  const province = a.state ? (PROVINCE_ABBR[a.state] ?? a.state) : "";
  const postal = a.postcode ?? "";
  return [street, city, province, postal].filter(Boolean).join(", ");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}` +
      `&format=json&countrycodes=ca&addressdetails=1&limit=8`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "7SunsDelivery/1.0 (info@7suns.ca)",
        "Accept-Language": "en",
        "Referer": "https://7suns.ca",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data: NomResult[] = await res.json();
    const suggestions = [...new Set(
      data.map(fmt).filter(s => s.length > 4)
    )].slice(0, 5);

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("[geocode]", err);
    return NextResponse.json([]);
  }
}
