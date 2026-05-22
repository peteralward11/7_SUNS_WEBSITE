import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://7suns.ca";

function adminClient() {
  return createServiceClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  const { email, name } = await req.json();
  if (!email?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Missing email or name" }, { status: 400 });
  }

  const admin = adminClient();

  // Upsert portal user (non-admin)
  const { error: upsertError } = await admin
    .from("fp_portal_users")
    .upsert({ email: email.trim(), name: name.trim(), is_admin: false }, { onConflict: "email", ignoreDuplicates: false });

  if (upsertError) {
    return NextResponse.json({ error: "Failed to create portal user" }, { status: 500 });
  }

  // Send invitation email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "7 Suns Delivery & Logistics <noreply@7suns.ca>",
      to: email.trim(),
      subject: "You've been invited to the 7 Suns portal",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
          <div style="font-size: 13pt; font-weight: 700; color: #111; letter-spacing: 0.06em; margin-bottom: 24px;">7SUNS</div>
          <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 12px;">You've been added to the portal</h1>
          <p style="font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 24px;">
            Hi ${name.trim()}, you've been set up as a team member on the 7 Suns delivery portal. You can now log in to view your upcoming scheduled jobs.
          </p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
            <p style="font-size: 13px; font-weight: 700; color: #111; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.06em;">How to log in</p>
            <p style="font-size: 14px; color: #333; margin: 0 0 8px;">1. Go to <a href="${SITE}/partners/login" style="color: #E8A33D; font-weight: 600;">${SITE}/partners/login</a></p>
            <p style="font-size: 14px; color: #333; margin: 0 0 8px;">2. Enter your email: <strong>${email.trim()}</strong></p>
            <p style="font-size: 14px; color: #333; margin: 0;">3. Check your inbox for a one-time login code</p>
          </div>
          <a href="${SITE}/partners/login" style="display: inline-block; background: #111; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
            Go to login →
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 32px;">7 Suns Delivery &amp; Logistics</p>
        </div>
      `,
    });
  } catch {
    // Email failure doesn't block — portal user was already created
  }

  return NextResponse.json({ success: true });
}
