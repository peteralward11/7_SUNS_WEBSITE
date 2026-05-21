import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = await createClient();

    /* Whitelist check */
    const { data: portalUser } = await supabase
      .from("fp_portal_users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (!portalUser) {
      return NextResponse.json(
        { error: "This email address is not authorised to access the portal." },
        { status: 403 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/partners/auth/callback`,
      },
    });

    if (error) {
      console.error("[partners/auth] OTP error:", error);
      return NextResponse.json({ error: "Failed to send sign-in link." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[partners/auth] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
