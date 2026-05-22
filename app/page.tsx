"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useBooking } from "@/lib/BookingContext";
import HeroImage from "@/components/HeroImage";

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
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
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

/* ─── Icons ─────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ─── Data ───────────────────────────────────────────── */
const services = [
  {
    num: "01",
    title: "Appliance Delivery",
    desc: "Residential and commercial delivery across Ontario — handled from our warehouse to your door, on your schedule.",
    icon: "📦",
  },
  {
    num: "02",
    title: "Professional Installation",
    desc: "Certified installation for all major appliance types. We connect, level, and test every unit before we leave.",
    icon: "🔧",
  },
  {
    num: "03",
    title: "Residential Projects",
    desc: "Single homes to large developments — we coordinate multi-unit delivery schedules without disruption.",
    icon: "🏠",
  },
  {
    num: "04",
    title: "Commercial & Builder Projects",
    desc: "Trusted by Ontario's top builders for high-volume, time-sensitive installs. We scale to your timeline.",
    icon: "🏗️",
  },
];

const steps = [
  {
    num: "01",
    title: "Schedule Online",
    desc: "Fill out our quick booking form with your delivery address, appliance type, and preferred date. Takes under 2 minutes.",
  },
  {
    num: "02",
    title: "We Handle Everything",
    desc: "Our team picks up from the warehouse, transports with care, and arrives on time — fully equipped for installation.",
  },
  {
    num: "03",
    title: "Installed & Confirmed",
    desc: "We connect, level, test, and clean up. You sign off only when everything is working perfectly.",
  },
];

const differentiators = [
  { icon: "✓", title: "Full-Service Delivery",  desc: "We manage the entire process — removal, placement, connection, and final inspection. Not just drop-off." },
  { icon: "✓", title: "White-Glove Standard",   desc: "Every job receives the same level of care, regardless of order size. No shortcuts." },
  { icon: "✓", title: "Built for Scale",         desc: "One unit or a 400-suite building — our fleet and team are structured for commercial volume." },
  { icon: "✓", title: "Builder Trusted",         desc: "The preferred delivery partner for Ontario's largest residential developers since 2009." },
  { icon: "✓", title: "On-Time Guarantee",       desc: "Our dispatch and logistics systems are built around your schedule. We show up when we say we will." },
  { icon: "✓", title: "Zero Cancellations",      desc: "When we commit to a job, we show up. No last-minute cancellations, ever." },
];

const serviceAreas = [
  { city: "Toronto", region: "GTA" },
  { city: "Mississauga", region: "GTA" },
  { city: "Brampton", region: "GTA" },
  { city: "Vaughan", region: "GTA" },
  { city: "Markham", region: "GTA" },
  { city: "Oakville", region: "GTA" },
  { city: "Hamilton", region: "South Ontario" },
  { city: "Kitchener", region: "South Ontario" },
  { city: "London", region: "South Ontario" },
  { city: "Windsor", region: "South Ontario" },
  { city: "Niagara Falls", region: "South Ontario" },
  { city: "Barrie", region: "Central" },
  { city: "Ottawa", region: "East" },
  { city: "Kingston", region: "East" },
  { city: "Sudbury", region: "North" },
  { city: "Thunder Bay", region: "North" },
];

const testimonials = [
  {
    quote: "Booked a delivery for our new fridge, stove, and dishwasher. The crew arrived on time, installed everything perfectly, and hauled away the old units. Seamless.",
    name: "Michael R.",
    title: "Homeowner, Vaughan",
    rating: 5,
  },
  {
    quote: "Scheduled same-week delivery for my new fridge and dishwasher. The team was professional, fast, and cleaned up after themselves. Couldn't ask for more.",
    name: "Sarah L.",
    title: "Homeowner, Mississauga",
    rating: 5,
  },
  {
    quote: "I've used 7 Suns twice now and they've been perfect both times. They actually show up when they say they will — that alone sets them apart.",
    name: "David K.",
    title: "Homeowner, Hamilton",
    rating: 5,
  },
];

const builders = [
  "Greenpark Homes", "Primont", "Brookfield Homes", "Country Wide Homes",
  "Treasure Hill Homes", "Zancor Homes", "Remington Homes", "Country Homes",
  "Delpak Homes", "Fieldgate Homes", "Saddlebrook MDM",
];

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  useScrollReveal();
  const { open } = useBooking();
  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO — Light cartographic theme
      ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-white"
        style={{ minHeight: "100dvh", paddingTop: "88px" }}
      >
        {/* Hero photo */}
        <HeroImage src="/hero-home.png" overlayRgb="248,249,251" className="z-[5]" />

        {/* Left gradient — keeps text crisp over the photo */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to right, rgba(248,249,251,0.97) 0%, rgba(248,249,251,0.94) 32%, rgba(248,249,251,0.60) 52%, rgba(248,249,251,0.12) 68%, transparent 82%)",
          }}
        />

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex items-center" style={{ minHeight: "calc(100dvh - 72px)" }}>
          <div className="w-full py-10 lg:py-20">

            {/* ── Left: copy ── */}
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <p
                className="reveal-1 text-xs font-semibold uppercase tracking-[0.2em] mb-5 md:mb-8 flex items-center gap-3"
                style={{ color: "#6BBF44", fontFamily: "var(--font-outfit)" }}
              >
                <span
                  className="inline-block w-5 h-px"
                  style={{ backgroundColor: "#6BBF44" }}
                />
                Ontario&apos;s Appliance Delivery Team &middot; Est. 2009
              </p>

              {/* Headline — Outfit grotesque */}
              <h1
                className="reveal-2 text-balance"
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: "clamp(1.9rem, 8vw, 5.5rem)",
                  fontWeight: 700,
                  lineHeight: 1.0,
                  letterSpacing: "-0.04em",
                  color: "#1B3A5C",
                }}
              >
                Every Appliance,<br />
                Delivered and<br />
                Installed{" "}
                <span style={{ color: "#6BBF44" }}>
                  Right.
                </span>
              </h1>

              {/* Subline */}
              <p
                className="reveal-3 mt-5 md:mt-7 text-base md:text-lg leading-relaxed"
                style={{
                  color: "#4A5568",
                  maxWidth: "460px",
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 300,
                }}
              >
                From single-family homes to large-scale builder projects — 7 Suns coordinates every stage of appliance delivery and installation across the province.
              </p>

              {/* CTAs */}
              <div className="reveal-4 mt-7 md:mt-10 flex flex-col sm:flex-row gap-3">
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
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.opacity = "0.92"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Schedule a Delivery <ArrowRight />
                </button>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg font-medium text-sm"
                  style={{
                    border: "1px solid rgba(12,20,32,0.2)",
                    color: "#0C1420",
                    fontFamily: "var(--font-outfit)",
                    transition: "background-color 0.2s, border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(12,20,32,0.06)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  Our Services
                </Link>
              </div>

              {/* Trust signal */}
              <p
                className="reveal-5 mt-5 md:mt-10 text-xs tracking-wide"
                style={{ color: "#94A3B8", fontFamily: "var(--font-outfit)" }}
              >
                Trusted by Greenpark, Primont, Brookfield, Fieldgate &amp; 7 more Ontario builders
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SERVICES — 2×2 tile grid
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              What We Do
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C" }}>
                End-To-End Appliance Services
              </h2>
              <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#6BBF44", fontFamily: "var(--font-outfit)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "gap 0.2s", flexShrink: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.gap = "10px"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.gap = "8px"; }}>
                View all services <ArrowRight />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map(({ num, title, desc }, idx) => (
              <Link key={num} href="/services"
                className="group relative flex flex-col justify-between p-5 sm:p-8 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  minHeight: "240px",
                  transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.3s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
                {/* Background number */}
                <span className="absolute right-6 top-4 select-none pointer-events-none"
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "6rem", fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 1, color: "rgba(107,191,68,0.08)", transition: "color 0.3s" }}>
                  {num}
                </span>
                <div>
                  <span className="inline-block mb-4 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "rgba(107,191,68,0.1)", color: "#4A8C28", fontFamily: "var(--font-outfit)", letterSpacing: "0.06em" }}>
                    {num}
                  </span>
                  <h3 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#1B3A5C", marginBottom: "10px", lineHeight: 1.2 }}>
                    {title}
                  </h3>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", color: "#64748B", fontWeight: 300, lineHeight: 1.7 }}>
                    {desc}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold"
                  style={{ color: "#6BBF44", fontFamily: "var(--font-outfit)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "gap 0.2s" }}>
                  Learn more <ArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS — 3-step process tiles
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#F4F5F9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14 text-center" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              The Process
            </p>
            <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C" }}>
              Simple From Start to Finish
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map(({ num, title, desc }, idx) => (
              <div key={num}
                className="relative flex flex-col p-5 md:p-8 rounded-2xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                data-reveal
                data-delay={String(idx + 1)}
              >
                {/* Step connector line (not last) */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 -right-2 w-4 h-px z-10"
                    style={{ backgroundColor: "#6BBF44", opacity: 0.4 }} />
                )}
                <div className="flex items-center justify-center w-12 h-12 rounded-full mb-6"
                  style={{ backgroundColor: "rgba(107,191,68,0.12)" }}>
                  <span style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 700, color: "#4A8C28" }}>{num}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#1B3A5C", marginBottom: "10px" }}>
                  {title}
                </h3>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", color: "#64748B", fontWeight: 300, lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center" data-reveal>
            <button
              onClick={open}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: "#6BBF44", color: "#0C1420",
                fontFamily: "var(--font-outfit)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(107,191,68,0.25)",
                transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 24px rgba(107,191,68,0.35)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(107,191,68,0.25)"; }}
            >
              Book Your Delivery <ArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS — 3 tiles
      ══════════════════════════════════════════════ */}
      <section className="py-12 md:py-20" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(12,20,32,0.06)", borderBottom: "1px solid rgba(12,20,32,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { target: 15, suffix: "+", label: "Years in business", sub: "Founded 2009" },
              { target: 400, suffix: "K+", label: "Deliveries completed", sub: "Across Ontario" },
              { target: 25, suffix: "+", label: "Builder partners", sub: "Trusted by the best" },
            ].map(({ target, suffix, label, sub }, i) => (
              <div key={label}
                className="flex flex-col items-center text-center p-6 md:p-10 rounded-2xl"
                style={{ backgroundColor: "#F8F9FB", border: "1px solid rgba(12,20,32,0.06)" }}
                data-reveal
                data-delay={String(i + 1)}
              >
                <div style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2.8rem, 4vw, 4rem)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, color: "#6BBF44", marginBottom: "10px" }}>
                  <StatCounter target={target} suffix={suffix} />
                </div>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", fontWeight: 600, color: "#1B3A5C", marginBottom: "4px" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 300, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUSTED BUILDERS MARQUEE
      ══════════════════════════════════════════════ */}
      <section className="py-10 md:py-14 overflow-hidden" style={{ backgroundColor: "#ECEEF4" }}>
        <p className="text-center text-xs font-semibold uppercase mb-8 tracking-widest"
           style={{ color: "#94A3B8", fontFamily: "var(--font-outfit)" }}>
          Trusted by Ontario&apos;s Top Builders
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #ECEEF4, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, #ECEEF4, transparent)" }} />
          <div className="marquee-track">
            {[...builders, ...builders].map((name, i) => (
              <div key={`${name}-${i}`} className="flex-shrink-0 mx-4 whitespace-nowrap"
                style={{ padding: "9px 22px", borderRadius: "999px", border: "1px solid rgba(12,20,32,0.1)", backgroundColor: "#FFFFFF", fontSize: "13px", fontWeight: 400, color: "#4A5568", fontFamily: "var(--font-outfit)", letterSpacing: "0.02em" }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHY CHOOSE 7 SUNS — 3×2 tile grid
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Our Difference
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C" }}>
                Why Choose 7 Suns
              </h2>
              <Link href="/why-choose-us" className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#6BBF44", fontFamily: "var(--font-outfit)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "gap 0.2s", flexShrink: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.gap = "10px"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.gap = "8px"; }}>
                Full story <ArrowRight />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {differentiators.map(({ title, desc }, idx) => (
              <div key={title}
                className="group flex flex-col p-4 sm:p-7 rounded-2xl"
                style={{
                  backgroundColor: "#F8F9FB",
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-5 flex-shrink-0"
                  style={{ backgroundColor: "rgba(107,191,68,0.12)" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="#4A8C28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: "var(--font-outfit)", fontSize: "1rem", fontWeight: 700, color: "#1B3A5C", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                  {title}
                </h3>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: "#64748B", fontWeight: 300, lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SERVICE AREAS — City tile grid
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#F4F5F9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14 text-center" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              Coverage
            </p>
            <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C", marginBottom: "16px" }}>
              We Deliver Across Ontario
            </h2>
            <p style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", fontWeight: 300, color: "#64748B", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
              From Windsor to Ottawa, Sudbury to Niagara — our team covers the full province.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center" data-reveal data-delay="1">
            {serviceAreas.map(({ city }) => (
              <div
                key={city}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(12,20,32,0.08)",
                  fontFamily: "var(--font-outfit)",
                  fontSize: "13.5px",
                  color: "#1B3A5C",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(12,20,32,0.06), 0 1px 2px rgba(12,20,32,0.04)",
                  transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s, border-color 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 6px 20px rgba(12,20,32,0.1), 0 2px 6px rgba(12,20,32,0.06)";
                  el.style.borderColor = "rgba(107,191,68,0.4)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 2px 8px rgba(12,20,32,0.06), 0 1px 2px rgba(12,20,32,0.04)";
                  el.style.borderColor = "rgba(12,20,32,0.08)";
                }}
              >
                <svg width="13" height="16" viewBox="0 0 13 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6.5 0C3.46 0 1 2.46 1 5.5c0 4.25 5.5 10 5.5 10S12 9.75 12 5.5C12 2.46 9.54 0 6.5 0z"
                    fill="#6BBF44" />
                  <circle cx="6.5" cy="5.5" r="2" fill="#FFFFFF" />
                </svg>
                {city}
              </div>
            ))}

            {/* + more tag */}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: "rgba(107,191,68,0.08)",
                border: "1px solid rgba(107,191,68,0.25)",
                fontFamily: "var(--font-outfit)",
                fontSize: "13.5px",
                color: "#4A8C28",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(107,191,68,0.08)",
                letterSpacing: "0.01em",
              }}
            >
              + More Across Ontario
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS — 3 review tiles
      ══════════════════════════════════════════════ */}
      <section className="py-14 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8 md:mb-14 text-center" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              Reviews
            </p>
            <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C" }}>
              What Clients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map(({ quote, name, title, rating }, idx) => (
              <div key={name}
                className="flex flex-col justify-between p-5 sm:p-8 rounded-2xl"
                style={{
                  backgroundColor: "#F8F9FB",
                  border: "1px solid rgba(12,20,32,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                data-reveal
                data-delay={String(idx + 1)}
              >
                {/* Stars */}
                <div>
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#6BBF44" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "14.5px", color: "#334155", lineHeight: 1.75, fontWeight: 300, fontStyle: "italic", marginBottom: "24px" }}>
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
                <div style={{ borderTop: "1px solid rgba(12,20,32,0.07)", paddingTop: "16px" }}>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 600, color: "#1B3A5C" }}>{name}</p>
                  <p style={{ fontFamily: "var(--font-outfit)", fontSize: "12px", color: "#94A3B8", fontWeight: 300 }}>{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA — Full-width centered
      ══════════════════════════════════════════════ */}
      <section className="py-16 md:py-28 relative overflow-hidden" style={{ backgroundColor: "#F4F5F9" }}>
        <div className="absolute pointer-events-none inset-0"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(107,191,68,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-10" data-reveal>
            <span style={{ display: "block", height: "1px", width: "40px", backgroundColor: "rgba(107,191,68,0.5)" }} />
            <span style={{ display: "block", width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#6BBF44", boxShadow: "0 0 10px rgba(107,191,68,0.5)" }} />
            <span style={{ display: "block", height: "1px", width: "40px", backgroundColor: "rgba(107,191,68,0.5)" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.0, color: "#1B3A5C", marginBottom: "18px" }}
            data-reveal="scale" data-delay="1">
            Let&apos;s Get Your<br />Delivery Booked.
          </h2>
          <p style={{ fontFamily: "var(--font-outfit)", fontSize: "16px", fontWeight: 300, color: "#64748B", lineHeight: 1.7, marginBottom: "36px" }}
            data-reveal data-delay="2">
            Our team will confirm your delivery date and handle every detail from there.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center" data-reveal data-delay="3">
            <button
              onClick={open}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: "#6BBF44", color: "#0C1420",
                fontFamily: "var(--font-outfit)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 24px rgba(107,191,68,0.25)",
                transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 32px rgba(107,191,68,0.35)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 24px rgba(107,191,68,0.25)"; }}
            >
              Book Now <ArrowRight />
            </button>
            <Link href="/contact"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-medium text-sm"
              style={{
                border: "1px solid rgba(12,20,32,0.15)", color: "#1B3A5C",
                fontFamily: "var(--font-outfit)", backgroundColor: "#FFFFFF",
                transition: "border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6BBF44"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,20,32,0.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}