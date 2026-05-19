"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

/* ─── Scroll reveal hook ─────────────────────────────── */
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

/* ─── Stat counter ────────────────────────────────────── */
function StatCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let start = 0;
        const step = Math.ceil(target / 40);
        const tick = () => {
          start = Math.min(start + step, target);
          el.textContent = start + suffix;
          if (start < target) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Data ───────────────────────────────────────────── */
const team = [
  {
    name: "Nick Cea",
    title: "President",
    bio: "Nick leads 7 Suns with a hands-on approach to client relationships, operational standards, and company growth. His focus on accountability and reliability has shaped the culture that Ontario's top builders depend on.",
    image: "/nick-cea.png",
  },
  {
    name: "John Alward",
    title: "Vice President",
    bio: "John oversees logistics, delivery operations, and builder partnerships across Ontario. His background in large-scale project coordination ensures every job — from a single unit to a 400-suite high-rise — runs on schedule.",
    image: "/john-alward.jpg",
  },
];

const values = [
  {
    title: "Reliability",
    desc: "We show up when we say we will. No exceptions, no last-minute cancellations.",
  },
  {
    title: "White-Glove Standard",
    desc: "Every job gets the same level of care regardless of order size. We don't do shortcuts.",
  },
  {
    title: "Built for Scale",
    desc: "One unit or a 400-suite tower — our team and fleet are structured to handle both.",
  },
  {
    title: "Ontario Focused",
    desc: "We know this province, its builders, and what their timelines demand.",
  },
  {
    title: "No Surprises",
    desc: "Transparent pricing, clear communication, and full confirmation before we start.",
  },
  {
    title: "Full Ownership",
    desc: "We manage the entire process — pickup, transport, install, cleanup. You shouldn't have to think twice.",
  },
];

/* ─── Page ───────────────────────────────────────────── */
export default function AboutPage() {
  useScrollReveal();

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#F4F5F9", paddingTop: "88px" }}
      >
        {/* Hero photo — right side */}
        <div className="absolute inset-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/SHOP_IMAGE.png"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "68%",
              objectFit: "cover",
              objectPosition: "center center",
            }}
          />
          {/* Left-to-right fade so dark text stays readable */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(244,245,249,1) 0%, rgba(244,245,249,1) 30%, rgba(244,245,249,0.92) 42%, rgba(244,245,249,0.65) 54%, rgba(244,245,249,0.22) 68%, rgba(244,245,249,0.04) 80%, transparent 90%)",
          }} />
          {/* Bottom fade */}
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0, height: "30%",
            background: "linear-gradient(to top, rgba(244,245,249,1) 0%, transparent 100%)",
          }} />
        </div>

        {/* Mobile: solid overlay so photo doesn't bleed through */}
        <div className="absolute inset-0 pointer-events-none sm:hidden" style={{ backgroundColor: "rgba(244,245,249,0.88)" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-24">
          <div className="max-w-3xl" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-6 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              About Us
            </p>
            <h1
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "clamp(1.9rem, 8vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                color: "#1B3A5C",
                marginBottom: "24px",
              }}
            >
              Done Right.<br />
              <span style={{ color: "#6BBF44" }}>Every Time.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "18px",
                fontWeight: 300,
                color: "#4A5568",
                lineHeight: 1.7,
                maxWidth: "520px",
              }}
            >
              From single-family homes to large-scale builder projects — 7 Suns has spent over fifteen years delivering and installing appliances across Ontario with the same white-glove standard every time.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COMPANY STORY
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left: narrative */}
            <div data-reveal>
              <p
                className="text-xs font-semibold uppercase mb-6 flex items-center gap-3"
                style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
              >
                <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
                Our Story
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  color: "#1B3A5C",
                  marginBottom: "28px",
                }}
              >
                Built on Reliability.<br />Grown on Trust.
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 300, color: "#4A5568", lineHeight: 1.8 }}>
                  7 Suns was founded in 2009 with a straightforward goal: deliver appliances the right way. Not just drop them at the door — but carry them in, connect them, test them, and leave the space cleaner than we found it.
                </p>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 300, color: "#4A5568", lineHeight: 1.8 }}>
                  Over the years, that commitment earned us the trust of Ontario&apos;s top residential builders. What started with residential deliveries grew into full-scale builder programs — coordinating hundreds of units across developments from Windsor to Ottawa, on schedules that don&apos;t tolerate delays.
                </p>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 300, color: "#4A5568", lineHeight: 1.8 }}>
                  Today, we serve homeowners, property managers, and the province&apos;s largest developers with the same standard we started with: show up on time, do the job right, and stand behind it.
                </p>
              </div>
            </div>

            {/* Right: founding highlight tile */}
            <div data-reveal="right">
              <div
                className="rounded-2xl p-6 sm:p-10 md:p-12 flex flex-col justify-between"
                style={{
                  backgroundColor: "#1B3A5C",
                  minHeight: "380px",
                  boxShadow: "0 20px 60px rgba(27,58,92,0.22), 0 4px 16px rgba(0,0,0,0.1)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "#6BBF44",
                      marginBottom: "12px",
                    }}
                  >
                    Est.
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "clamp(5rem, 10vw, 8rem)",
                      fontWeight: 800,
                      letterSpacing: "-0.06em",
                      lineHeight: 1,
                      color: "rgba(255,255,255,0.95)",
                    }}
                  >
                    2009
                  </p>
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    paddingTop: "24px",
                    marginTop: "36px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.9)",
                      lineHeight: 1.4,
                      marginBottom: "12px",
                    }}
                  >
                    &ldquo;Built on reliability.<br />Grown on trust.&rdquo;
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "11px",
                      fontWeight: 300,
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Ontario-wide · Since 2009
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════ */}
      <section
        className="py-12 md:py-20"
        style={{
          backgroundColor: "#F4F5F9",
          borderTop: "1px solid rgba(12,20,32,0.06)",
          borderBottom: "1px solid rgba(12,20,32,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { target: 15, suffix: "+", label: "Years In Business", sub: "Founded 2009" },
              { target: 100, suffix: "K+", label: "Deliveries Completed", sub: "Across Ontario" },
              { target: 25, suffix: "+", label: "Builder Partners", sub: "Trusted By The Best" },
            ].map(({ target, suffix, label, sub }, i) => (
              <div
                key={label}
                className="flex flex-col items-center text-center p-6 md:p-10 rounded-2xl"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(12,20,32,0.06)" }}
                data-reveal
                data-delay={String(i + 1)}
              >
                <div
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "clamp(2.8rem, 4vw, 4rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                    color: "#6BBF44",
                    marginBottom: "10px",
                  }}
                >
                  <StatCounter target={target} suffix={suffix} />
                </div>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", fontWeight: 600, color: "#1B3A5C", marginBottom: "4px" }}>
                  {label}
                </p>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 300, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TEAM
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14 text-center" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-4"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              The Team
            </p>
            <h2
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#1B3A5C",
              }}
            >
              The People Behind Every Delivery.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {team.map(({ name, title, bio, image }, idx) => (
              <div
                key={name}
                className="flex flex-col rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.3s",
                }}
                data-reveal
                data-delay={String(idx + 1)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)";
                  el.style.borderColor = "rgba(107,191,68,0.4)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  el.style.borderColor = "rgba(12,20,32,0.07)";
                }}
              >
                {/* Photo */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 384px"
                  />
                </div>
                {/* Info */}
                <div className="p-6 flex flex-col">
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "#1B3A5C",
                      marginBottom: "4px",
                    }}
                  >
                    {name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6BBF44",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: "14px",
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "13.5px",
                      fontWeight: 300,
                      color: "#64748B",
                      lineHeight: 1.75,
                    }}
                  >
                    {bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          VALUES
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#F4F5F9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              What We Stand For
            </p>
            <h2
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#1B3A5C",
              }}
            >
              The Standards We Hold<br />Ourselves To.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map(({ title, desc }, idx) => (
              <div
                key={title}
                className="flex flex-col p-4 sm:p-7 rounded-2xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.3s",
                }}
                data-reveal
                data-delay={String((idx % 3) + 1)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.09)";
                  el.style.borderColor = "rgba(107,191,68,0.35)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  el.style.borderColor = "rgba(12,20,32,0.07)";
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-5 flex-shrink-0"
                  style={{ backgroundColor: "rgba(107,191,68,0.12)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="#4A8C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#1B3A5C",
                    marginBottom: "8px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "13.5px",
                    color: "#64748B",
                    fontWeight: 300,
                    lineHeight: 1.75,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
