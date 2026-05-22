import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: portalUser } = await supabase
    .from("fp_portal_users")
    .select("is_admin")
    .eq("email", user.email ?? "")
    .single();
  if (!portalUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bookingId = formData.get("booking_id") as string | null;

  if (!file || !bookingId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${bookingId}/${Date.now()}.${ext}`;

  // Use service role key for storage writes
  const admin = createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: uploadError } = await admin.storage
    .from("JOB-PHOTOS")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[photos] upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("JOB-PHOTOS").getPublicUrl(path);
  const url = urlData.publicUrl;

  const { data, error } = await supabase
    .from("fp_job_photos")
    .insert({ booking_id: bookingId, url, uploaded_by: user.email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ photo: data });
}
