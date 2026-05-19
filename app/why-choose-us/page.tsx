"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
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

/* ─── Stat counter ───────────────────────────────────── */
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

/* ─── Icons ─────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8L6.5 11.5L13 4.5" stroke="#4A8C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Data ───────────────────────────────────────────── */
const differentiators = [
  {
    num: "01",
    title: "Full-Service Delivery",
    summary: "Not just drop-off.",
    desc: "Most delivery companies bring the appliance to the door and stop there. We don't. Our team carries every unit to the room of choice, unpacks, connects, levels, tests, and removes all packaging before we leave. What you get is an appliance that works — not a box sitting in your hallway.",
    proof: "Every delivery includes full placement and packaging removal. No exceptions.",
  },
  {
    num: "02",
    title: "White-Glove Standard",
    summary: "Every job, every time.",
    desc: "We apply the same standard to a single fridge delivery as we do to a 400-unit builder project. There's no downgraded service for smaller orders. Our crew treats every home with the same level of care — protecting floors, walls, and finishes throughout the process.",
    proof: "15+ years with zero reported property damage incidents.",
  },
  {
    num: "03",
    title: "Built for Scale",
    summary: "One unit or one thousand.",
    desc: "Ontario's largest residential builders trust 7 Suns because we actually scale. We have the fleet, the crew, and the logistics infrastructure to coordinate multi-unit developments without the communication gaps that sink other companies. One point of contact. Real-time updates. No dropped balls.",
    proof: "Coordinated 400+ unit high-rise installations on single projects.",
  },
  {
    num: "04",
    title: "On-Time. Every Time.",
    summary: "Your schedule is our schedule.",
    desc: "We built our dispatch and logistics systems around one principle: if we commit to a time, we show up at that time. Our clients — especially builders — can't afford delays. Our track record speaks for itself: we have never missed a committed delivery window.",
    proof: "100% on-time delivery rate across all committed windows.",
  },
  {
    num: "05",
    title: "Zero Cancellations",
    summary: "We show up. Period.",
    desc: "Last-minute cancellations from service providers cost builders money, disrupt site schedules, and erode trust. We don't cancel. In over fifteen years of operation, 7 Suns has never cancelled a committed job. If we say we'll be there, we'll be there.",
    proof: "Zero cancellations in 15+ years of operation.",
  },
  {
    num: "06",
    title: "Builder Trusted",
    summary: "Earned through performance.",
    desc: "The builders that trust 7 Suns didn't choose us because of a sales pitch — they chose us because we performed. Again and again, on tight timelines, with high stakes. That's how you end up as the preferred partner of Greenpark, Primont, Brookfield, and Ontario's other top developers.",
    proof: "10+ builder partnerships, all earned through repeated performance.",
  },
];

const testimonials = [
  {
    quote: "Booked a delivery for our new fridge, stove, and dishwasher. The crew arrived on time, installed everything perfectly, and hauled away the old units. Seamless.",
    name: "Michael R.",
    location: "Homeowner, Vaughan",
    rating: 5,
  },
  {
    quote: "Scheduled same-week delivery for my new fridge and dishwasher. The team was professional, fast, and cleaned up after themselves. Couldn't ask for more.",
    name: "Sarah L.",
    location: "Homeowner, Mississauga",
    rating: 5,
  },
  {
    quote: "I've used 7 Suns twice now and they've been perfect both times. They actually show up when they say they will — that alone sets them apart.",
    name: "David K.",
    location: "Homeowner, Hamilton",
    rating: 5,
  },
];

const builders = [
  "Greenpark Homes", "Primont", "Brookfield Homes", "Country Wide Homes",
  "Treasure Hill Homes", "Zancor Homes", "Remington Homes", "Country Homes",
  "Delpak Homes", "Fieldgate Homes", "Saddlebrook MDM",
];

/* ─── Page ───────────────────────────────────────────── */
export default function WhyChooseUsPage() {
  useScrollReveal();
  const { open } = useBooking();

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
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-6 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Our Difference
            </p>
            <h1
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                color: "#1B3A5C",
                marginBottom: "24px",
              }}
            >
              Why Ontario&apos;s best<br />
              builders choose{" "}
              <span style={{ color: "#6BBF44" }}>7 Suns.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "18px",
                fontWeight: 300,
                color: "#4A5568",
                lineHeight: 1.7,
                maxWidth: "540px",
              }}
            >
              Fifteen years of showing up on time, doing the job right, and never cancelling. Here&apos;s exactly what sets us apart — with the track record to back it up.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DIFFERENTIATORS — expanded editorial cards
      ══════════════════════════════════════════════ */}
      <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">

          <div className="mb-16" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              The 7 Suns Difference
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
              Six reasons. All backed<br />by fifteen years of proof.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {differentiators.map(({ num, title, summary, desc, proof }, idx) => (
              <div
                key={num}
                className="relative flex flex-col p-8 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.3s, border-color 0.3s",
                }}
                data-reveal
                data-delay={String((idx % 2) + 1)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.09)";
                  el.style.borderColor = "rgba(107,191,68,0.35)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  el.style.borderColor = "rgba(12,20,32,0.07)";
                }}
              >
                {/* Ghost number */}
                <span
                  className="absolute right-6 top-4 select-none pointer-events-none"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "7rem",
                    fontWeight: 800,
                    letterSpacing: "-0.06em",
                    lineHeight: 1,
                    color: "rgba(107,191,68,0.07)",
                  }}
                >
                  {num}
                </span>

                {/* Number badge */}
                <span
                  className="inline-block mb-5 px-2.5 py-1 rounded-full text-xs font-semibold self-start"
                  style={{
                    backgroundColor: "rgba(107,191,68,0.1)",
                    color: "#4A8C28",
                    fontFamily: "var(--font-outfit)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {num}
                </span>

                {/* Title + summary */}
                <h3
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#1B3A5C",
                    marginBottom: "4px",
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6BBF44",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                  }}
                >
                  {summary}
                </p>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "14.5px",
                    color: "#4A5568",
                    fontWeight: 300,
                    lineHeight: 1.8,
                    marginBottom: "20px",
                    flex: 1,
                  }}
                >
                  {desc}
                </p>

                {/* Proof strip */}
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "rgba(107,191,68,0.08)", border: "1px solid rgba(107,191,68,0.16)" }}
                >
                  <span className="flex-shrink-0 mt-0.5">
                    <CheckIcon />
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#3A6B20",
                      lineHeight: 1.5,
                    }}
                  >
                    {proof}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════ */}
      <section
        className="py-20"
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
              { target: 5000, suffix: "+", label: "Deliveries Completed", sub: "Across Ontario" },
              { target: 10, suffix: "+", label: "Builder Partners", sub: "Trusted By The Best" },
            ].map(({ target, suffix, label, sub }, i) => (
              <div
                key={label}
                className="flex flex-col items-center text-center p-10 rounded-2xl"
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
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Client Reviews
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
              Don&apos;t take our word for it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map(({ quote, name, location, rating }, idx) => (
              <div
                key={name}
                className="flex flex-col justify-between p-8 rounded-2xl"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                data-reveal
                data-delay={String(idx + 1)}
              >
                <div>
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#6BBF44" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "14.5px",
                      color: "#334155",
                      lineHeight: 1.75,
                      fontWeight: 300,
                      fontStyle: "italic",
                      marginBottom: "24px",
                    }}
                  >
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
                <div style={{ borderTop: "1px solid rgba(12,20,32,0.07)", paddingTop: "16px" }}>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 600, color: "#1B3A5C" }}>{name}</p>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", color: "#94A3B8", fontWeight: 300 }}>{location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUSTED BUILDERS MARQUEE
      ══════════════════════════════════════════════ */}
      <section className="py-14 overflow-hidden" style={{ backgroundColor: "#ECEEF4" }}>
        <p
          className="text-center text-xs font-semibold uppercase mb-8 tracking-widest"
          style={{ color: "#94A3B8", fontFamily: "var(--font-outfit)" }}
        >
          Trusted by Ontario&apos;s Top Builders
        </p>
        <div className="relative overflow-hidden">
          <div
            className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #ECEEF4, transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, #ECEEF4, transparent)" }}
          />
          <div className="marquee-track">
            {[...builders, ...builders].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex-shrink-0 mx-4 whitespace-nowrap"
                style={{
                  padding: "9px 22px",
                  borderRadius: "999px",
                  border: "1px solid rgba(12,20,32,0.1)",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#4A5568",
                  fontFamily: "var(--font-outfit)",
                  letterSpacing: "0.02em",
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden" style={{ backgroundColor: "#F4F5F9" }}>
        <div
          className="absolute pointer-events-none inset-0"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(107,191,68,0.06) 0%, transparent 70%)" }}
        />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-10" data-reveal>
            <span style={{ display: "block", height: "1px", width: "40px", backgroundColor: "rgba(107,191,68,0.5)" }} />
            <span style={{ display: "block", width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#6BBF44", boxShadow: "0 0 10px rgba(107,191,68,0.5)" }} />
            <span style={{ display: "block", height: "1px", width: "40px", backgroundColor: "rgba(107,191,68,0.5)" }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: "#1B3A5C",
              marginBottom: "18px",
            }}
            data-reveal="scale"
            data-delay="1"
          >
            Ready to work with<br />a team you can trust?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#64748B",
              lineHeight: 1.7,
              marginBottom: "36px",
            }}
            data-reveal
            data-delay="2"
          >
            Book your delivery or get in touch — we&apos;ll confirm everything before we start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center" data-reveal data-delay="3">
            <button
              onClick={open}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: "#6BBF44",
                color: "#0C1420",
                fontFamily: "var(--font-outfit)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 24px rgba(107,191,68,0.25)",
                transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 32px rgba(107,191,68,0.35)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 24px rgba(107,191,68,0.25)";
              }}
            >
              Book Now <ArrowRight />
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-medium text-sm"
              style={{
                border: "1px solid rgba(12,20,32,0.15)",
                color: "#1B3A5C",
                fontFamily: "var(--font-outfit)",
                backgroundColor: "#FFFFFF",
                transition: "border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#6BBF44";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,20,32,0.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
