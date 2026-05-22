"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useBooking } from "@/lib/BookingContext";
import HeroImage from "@/components/HeroImage";

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

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const services = [
  {
    num: "01",
    title: "Appliance Delivery",
    cta: "Book a Delivery",
    description:
      "From our warehouse to your door — we manage the full delivery route so you don't have to. Every load is secured, handled with care, and arrived on your schedule. We serve residential homes, rental properties, and large-scale developments across Ontario.",
    includes: [
      "Warehouse pickup and full-route transport",
      "Careful unloading and room-of-choice placement",
      "Packaging removal and disposal",
      "Delivery confirmation and photo documentation",
    ],
    appliances: "Fridges, stoves, dishwashers, washers, dryers, built-in ovens, microwaves, and more.",
  },
  {
    num: "02",
    title: "Professional Installation",
    cta: "Book Installation",
    description:
      "Our certified technicians install every appliance to manufacturer spec. We connect, level, calibrate, and run a full function test before we leave — and we don't sign off until everything works perfectly. No shortcuts, no half-measures.",
    includes: [
      "Full connection to water, gas, or electrical lines",
      "Precise leveling and alignment",
      "Function testing and calibration",
      "Cleanup and old unit removal on request",
    ],
    appliances: "All major brands: Samsung, LG, GE, Bosch, Fisher & Paykel, Whirlpool, Miele, and more.",
  },
  {
    num: "03",
    title: "Residential Projects",
    cta: "Book Residential Service",
    description:
      "Whether it's a single-family home renovation or a multi-unit residential development, we coordinate every delivery and install around your build schedule. We communicate directly with site contacts and adapt to changes on the ground — no handholding required.",
    includes: [
      "Flexible scheduling around construction timelines",
      "Multi-unit coordination with site supervisors",
      "White-glove handling for high-end finishes",
      "Post-delivery punch-list support",
    ],
    appliances: "Single units to full building packages — any volume, any address in Ontario.",
  },
  {
    num: "04",
    title: "Commercial & Builder Projects",
    cta: "Talk To Our Builder Team",
    description:
      "Ontario's top residential builders trust 7 Suns for a reason: we show up, we scale, and we deliver on time — every time. We've handled everything from 12-unit townhomes to 400-suite high-rises, and we bring the same standard to every job.",
    includes: [
      "High-volume, time-sensitive delivery and install",
      "Dedicated account management for repeat clients",
      "Site-level logistics coordination",
      "Real-time status updates and delivery reporting",
    ],
    appliances: "Trusted by Greenpark, Primont, Brookfield, Fieldgate, Country Wide Homes, and more.",
  },
];

export default function ServicesPage() {
  useScrollReveal();
  const { open } = useBooking();

  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#F4F5F9", paddingTop: "88px" }}
      >
        <HeroImage src="/hero-services.png" />



        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-24">
          <div className="max-w-3xl" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-6 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)", textShadow: "0 1px 8px rgba(27,58,92,0.18)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              What We Do
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
              Delivered and Installed,<br />
              <span style={{ color: "#6BBF44", textShadow: "0 1px 8px rgba(27,58,92,0.18)" }}>Done Right.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "18px",
                fontWeight: 300,
                color: "#4A5568",
                lineHeight: 1.7,
                maxWidth: "520px",
                marginBottom: "36px",
              }}
            >
              End-to-end appliance delivery and installation across Ontario — for homeowners, contractors, and Ontario&apos;s top builders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={open}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: "#6BBF44",
                  color: "#0C1420",
                  fontFamily: "var(--font-outfit)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(107,191,68,0.25)",
                  transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Book a Delivery <ArrowRight />
              </button>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg font-medium text-sm"
                style={{
                  border: "1px solid rgba(12,20,32,0.2)",
                  color: "#1B3A5C",
                  fontFamily: "var(--font-outfit)",
                  transition: "background-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(12,20,32,0.06)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICE DETAIL TILES ══════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">

          <div className="mb-8 md:mb-16" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Our Services
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
              Everything You Need,<br />Nothing You Don&apos;t.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {services.map(({ num, title, cta, description, includes, appliances }, idx) => (
              <div
                key={num}
                className="relative flex flex-col p-5 sm:p-8 rounded-2xl overflow-hidden"
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
                {/* Content wrapper — flex:1 pushes CTA strip to card bottom */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                {/* Background number */}
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

                <h3
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#1B3A5C",
                    marginBottom: "12px",
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h3>

                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "14.5px",
                    color: "#4A5568",
                    fontWeight: 300,
                    lineHeight: 1.75,
                    marginBottom: "20px",
                  }}
                >
                  {description}
                </p>

                {/* Includes list */}
                <div
                  style={{
                    borderTop: "1px solid rgba(12,20,32,0.07)",
                    paddingTop: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#94A3B8",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    What&apos;s Included
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 8L6.5 11.5L13 4.5"
                            stroke="#4A8C28"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontFamily: "var(--font-outfit)",
                            fontSize: "13.5px",
                            color: "#334155",
                            fontWeight: 400,
                            lineHeight: 1.5,
                          }}
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Appliances note */}
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12.5px",
                    color: "#94A3B8",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  {appliances}
                </p>

                </div>{/* end content wrapper */}

                {/* CTA strip */}
                <div
                  className="mt-5 sm:mt-6 -mx-5 sm:-mx-8 -mb-5 sm:-mb-8 px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
                  style={{
                    backgroundColor: "rgba(107,191,68,0.07)",
                    borderTop: "1px solid rgba(107,191,68,0.18)",
                    borderRadius: "0 0 1rem 1rem",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", color: "#64748B", fontWeight: 300 }}>
                    No pricing surprises — we confirm everything before we start.
                  </p>
                  <button
                    onClick={open}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm"
                    style={{
                      backgroundColor: "#6BBF44",
                      color: "#0C1420",
                      fontFamily: "var(--font-outfit)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 12px rgba(107,191,68,0.3)",
                      transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s",
                      whiteSpace: "nowrap",
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
                    {cta} <ArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════ */}
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
              { target: 400, suffix: "K+", label: "Deliveries Completed", sub: "Across Ontario" },
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
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1B3A5C",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#94A3B8",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14 text-center" data-reveal>
            <p
              className="text-xs font-semibold uppercase mb-4"
              style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}
            >
              The Process
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
              Simple From Start to Finish
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "Schedule Online",
                desc: "Fill out our booking form with your delivery address, appliance type, and preferred date. Takes under 2 minutes.",
              },
              {
                num: "02",
                title: "We Handle Everything",
                desc: "Our team picks up, transports, and arrives on time — fully equipped for installation. You don't lift a finger.",
              },
              {
                num: "03",
                title: "Installed & Confirmed",
                desc: "We connect, level, test, and clean up. You sign off only when everything is working perfectly.",
              },
            ].map(({ num, title, desc }, idx) => (
              <div
                key={num}
                className="relative flex flex-col p-5 md:p-8 rounded-2xl"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                data-reveal
                data-delay={String(idx + 1)}
              >
                {idx < 2 && (
                  <div
                    className="hidden md:block absolute top-12 -right-2 w-4 h-px z-10"
                    style={{ backgroundColor: "#6BBF44", opacity: 0.4 }}
                  />
                )}
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full mb-6"
                  style={{ backgroundColor: "rgba(107,191,68,0.12)" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#4A8C28",
                    }}
                  >
                    {num}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#1B3A5C",
                    marginBottom: "10px",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "14px",
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

      {/* ══ CTA ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: "#F4F5F9" }}>
        <div
          className="absolute pointer-events-none inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(107,191,68,0.06) 0%, transparent 70%)",
          }}
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
              marginBottom: "16px",
            }}
            data-reveal="scale"
            data-delay="1"
          >
            Ready to Book<br />Your Delivery?
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
            No pricing games. No surprises. Our team will confirm your date and handle every detail from there.
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
