"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBooking } from "@/lib/BookingContext";

/* ─── Scroll reveal ──────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Icons ─────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/* ─── Field components ───────────────────────────────── */
const fieldBase: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-outfit)",
  fontSize: "14px",
  fontWeight: 400,
  color: "#1B3A5C",
  backgroundColor: "#FFFFFF",
  border: "1px solid rgba(12,20,32,0.14)",
  borderRadius: "10px",
  padding: "12px 14px",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontFamily: "var(--font-outfit)",
        fontSize: "12px",
        fontWeight: 600,
        color: "#1B3A5C",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      {children}
    </label>
  );
}

/* ─── Form state type ────────────────────────────────── */
type FormState = "idle" | "submitting" | "success" | "error";

/* ─── Page ───────────────────────────────────────────── */
export default function ContactPage() {
  useScrollReveal();
  const { open } = useBooking();

  const [formState, setFormState] = useState<FormState>("idle");
  const [focused, setFocused] = useState<string | null>(null);

  const focusStyle = (name: string): React.CSSProperties =>
    focused === name
      ? { borderColor: "#6BBF44", boxShadow: "0 0 0 3px rgba(107,191,68,0.12)" }
      : {};

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setFormState("success");
      form.reset();
    } catch {
      setFormState("error");
    }
  }

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#F4F5F9", paddingTop: "88px" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(12,20,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(12,20,32,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-2xl" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-6 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Get In Touch
            </p>
            <h1
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                color: "#1B3A5C",
                marginBottom: "20px",
              }}
            >
              We&apos;d love to<br />
              hear from{" "}
              <span style={{ color: "#6BBF44" }}>you.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "17px",
                fontWeight: 300,
                color: "#4A5568",
                lineHeight: 1.7,
                maxWidth: "480px",
              }}
            >
              Questions about our services, builder partnerships, or a project you&apos;re planning — send us a message and we&apos;ll get back to you within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FORM + SIDEBAR
      ══════════════════════════════════════════════ */}
      <section className="py-20" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

            {/* ── Contact Form ── */}
            <div
              className="rounded-2xl p-8 sm:p-10"
              style={{
                backgroundColor: "#F8F9FB",
                border: "1px solid rgba(12,20,32,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
              data-reveal
            >
              {formState === "success" ? (
                /* Success state */
                <div className="flex flex-col items-center text-center py-12">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                    style={{ backgroundColor: "rgba(107,191,68,0.12)" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 12L9 17L20 6" stroke="#4A8C28" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1B3A5C",
                      letterSpacing: "-0.02em",
                      marginBottom: "12px",
                    }}
                  >
                    Message sent.
                  </h2>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "15px",
                      fontWeight: 300,
                      color: "#64748B",
                      lineHeight: 1.7,
                      maxWidth: "360px",
                    }}
                  >
                    Thanks for reaching out. We&apos;ll review your message and get back to you within one business day.
                  </p>
                  <button
                    onClick={() => setFormState("idle")}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: "#6BBF44", fontFamily: "var(--font-outfit)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
                  >
                    Send another message <ArrowRight />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h2
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "#1B3A5C",
                      marginBottom: "6px",
                    }}
                  >
                    Send us a message
                  </h2>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "13.5px",
                      fontWeight: 300,
                      color: "#94A3B8",
                      marginBottom: "32px",
                      lineHeight: 1.6,
                    }}
                  >
                    Not ready to book yet? Use this form for questions, quotes, and project inquiries.
                  </p>

                  {/* Row 1: Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Jane Smith"
                        style={{ ...fieldBase, ...focusStyle("name") }}
                        onFocus={() => setFocused("name")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="jane@example.com"
                        style={{ ...fieldBase, ...focusStyle("email") }}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone + Inquiry Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <Label htmlFor="phone">Phone <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "#94A3B8" }}>(optional)</span></Label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(416) 555-0100"
                        style={{ ...fieldBase, ...focusStyle("phone") }}
                        onFocus={() => setFocused("phone")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inquiry">Inquiry Type</Label>
                      <div style={{ position: "relative" }}>
                        <select
                          id="inquiry"
                          name="inquiry"
                          required
                          defaultValue=""
                          style={{
                            ...fieldBase,
                            ...focusStyle("inquiry"),
                            appearance: "none",
                            paddingRight: "40px",
                            color: "#1B3A5C",
                            cursor: "pointer",
                          }}
                          onFocus={() => setFocused("inquiry")}
                          onBlur={() => setFocused(null)}
                        >
                          <option value="" disabled>Select one…</option>
                          <option value="general">General Inquiry</option>
                          <option value="residential">Residential Project</option>
                          <option value="builder">Builder / Commercial Project</option>
                          <option value="partnership">Partnership Opportunity</option>
                          <option value="other">Other</option>
                        </select>
                        {/* Chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div className="mb-7">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Tell us about your project, question, or how we can help…"
                      style={{
                        ...fieldBase,
                        ...focusStyle("message"),
                        resize: "vertical",
                        minHeight: "130px",
                        lineHeight: 1.65,
                      }}
                      onFocus={() => setFocused("message")}
                      onBlur={() => setFocused(null)}
                    />
                  </div>

                  {/* Error */}
                  {formState === "error" && (
                    <p
                      className="mb-5 text-sm"
                      style={{ fontFamily: "var(--font-outfit)", color: "#DC2626", fontWeight: 400 }}
                    >
                      Something went wrong. Please try again or email us directly at{" "}
                      <a href="mailto:info@7Suns.ca" style={{ textDecoration: "underline" }}>info@7Suns.ca</a>.
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm"
                    style={{
                      backgroundColor: formState === "submitting" ? "rgba(107,191,68,0.6)" : "#6BBF44",
                      color: "#0C1420",
                      fontFamily: "var(--font-outfit)",
                      border: "none",
                      cursor: formState === "submitting" ? "not-allowed" : "pointer",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(107,191,68,0.25)",
                      transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.2s, background-color 0.2s",
                    }}
                    onMouseEnter={e => {
                      if (formState !== "submitting") (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  >
                    {formState === "submitting" ? "Sending…" : <>Send Message <ArrowRight /></>}
                  </button>
                </form>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="flex flex-col gap-4" data-reveal="right" data-delay="1">

              {/* Email card */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(107,191,68,0.12)", color: "#4A8C28" }}
                >
                  <MailIcon />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#94A3B8",
                    marginBottom: "6px",
                  }}
                >
                  Email Us
                </p>
                <a
                  href="mailto:info@7Suns.ca"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1B3A5C",
                    display: "block",
                    marginBottom: "6px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#6BBF44"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#1B3A5C"; }}
                >
                  info@7Suns.ca
                </a>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12.5px",
                    fontWeight: 300,
                    color: "#94A3B8",
                    lineHeight: 1.6,
                  }}
                >
                  We read every message personally.
                </p>
              </div>

              {/* Response time card */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(107,191,68,0.12)", color: "#4A8C28" }}
                >
                  <ClockIcon />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#94A3B8",
                    marginBottom: "6px",
                  }}
                >
                  Response Time
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1B3A5C",
                    marginBottom: "6px",
                  }}
                >
                  Within 1 business day
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12.5px",
                    fontWeight: 300,
                    color: "#94A3B8",
                    lineHeight: 1.6,
                  }}
                >
                  Mon – Fri, 8am – 6pm EST.
                </p>
              </div>

              {/* Book Now card */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "#1B3A5C",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 20px rgba(27,58,92,0.18)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(107,191,68,0.18)", color: "#6BBF44" }}
                >
                  <CalendarIcon />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(107,191,68,0.85)",
                    marginBottom: "6px",
                  }}
                >
                  Ready to Schedule?
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.92)",
                    marginBottom: "8px",
                    lineHeight: 1.35,
                  }}
                >
                  Skip the queue — book your delivery directly.
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12.5px",
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6,
                    marginBottom: "18px",
                  }}
                >
                  Our booking form lets you select your appliance type, address, and preferred date in under two minutes.
                </p>
                <button
                  onClick={open}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm"
                  style={{
                    backgroundColor: "#6BBF44",
                    color: "#0C1420",
                    fontFamily: "var(--font-outfit)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 12px rgba(107,191,68,0.3)",
                    transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 20px rgba(107,191,68,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 12px rgba(107,191,68,0.3)";
                  }}
                >
                  Book Now <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
