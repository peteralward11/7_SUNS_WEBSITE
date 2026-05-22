import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: buckets, error } = await admin.storage.listBuckets();

  return NextResponse.json({
    buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) ?? [],
    error: error?.message ?? null,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "MISSING",
    serviceKeySet: !!(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
