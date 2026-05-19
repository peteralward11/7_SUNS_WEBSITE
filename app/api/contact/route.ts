import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import ContactNotification from "@/emails/ContactNotification";

const FROM = "contact@7suns.ca";
const TEAM_EMAIL = "info@7Suns.ca";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "build-placeholder");
  try {
    const body = await req.json();
    const { name, email, phone, inquiry, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await resend.emails.send({
      from: FROM,
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `Contact: ${name} — ${inquiry ?? "General Inquiry"}`,
      react: ContactNotification({ name, email, phone, inquiry, message }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
