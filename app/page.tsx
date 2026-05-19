"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useBooking } from "@/lib/BookingContext";

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

/* ─── Map Background ─────────────────────────────────── */
function MapBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Dense urban blocks */}
        <pattern id="blocks-dense" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill="#E9EBF1"/>
          <rect x="5" y="5" width="38" height="38" fill="#F6F7FA"/>
        </pattern>
        {/* Suburban blocks — larger */}
        <pattern id="blocks-sub" x="0" y="0" width="80" height="60" patternUnits="userSpaceOnUse">
          <rect width="80" height="60" fill="#ECEEF4"/>
          <rect x="7" y="7" width="66" height="46" fill="#F4F5F9"/>
        </pattern>
        {/* Fine street grid */}
        <pattern id="fine-street" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E0E3EC" strokeWidth="0.35"/>
        </pattern>
      </defs>

      {/* ── Base ── */}
      <rect width="1440" height="900" fill="#F3F4F8"/>
      <rect width="1440" height="900" fill="url(#blocks-sub)"/>
      {/* Denser urban core (south-central — GTA) */}
      <rect x="540" y="380" width="480" height="380" fill="url(#blocks-dense)"/>
      {/* Fine street overlay everywhere */}
      <rect width="1440" height="900" fill="url(#fine-street)" opacity="0.5"/>

      {/* ── Water bodies ── */}
      {/* Lake Ontario — bottom band */}
      <path d="M 0 840 Q 360 820 720 835 Q 1000 845 1440 825 L 1440 900 L 0 900 Z"
            fill="#DCE8F4" opacity="0.75"/>
      {/* Georgian Bay — upper right */}
      <ellipse cx="1180" cy="110" rx="220" ry="95" fill="#DCE8F4" opacity="0.6"/>
      {/* Lake Simcoe */}
      <ellipse cx="760" cy="290" rx="55" ry="38" fill="#DCE8F4" opacity="0.55"/>

      {/* ── Parks / green areas ── */}
      <rect x="310" y="450" width="75" height="55" fill="#D8EFC9" rx="4" opacity="0.7"/>
      <rect x="880" y="560" width="90" height="65" fill="#D8EFC9" rx="4" opacity="0.65"/>
      <rect x="1060" y="220" width="70" height="50" fill="#D8EFC9" rx="4" opacity="0.6"/>
      <rect x="180" y="300" width="60" height="45" fill="#D8EFC9" rx="4" opacity="0.6"/>
      <rect x="620" y="160" width="80" height="55" fill="#D8EFC9" rx="4" opacity="0.55"/>
      <rect x="1250" y="440" width="85" height="60" fill="#D8EFC9" rx="4" opacity="0.55"/>
      <rect x="440" y="700" width="65" height="45" fill="#D8EFC9" rx="4" opacity="0.5"/>

      {/* ══ HIGHWAYS ══ */}
      {/* Hwy 401 — main E-W spine */}
      <path d="M 0 580 Q 400 572 700 568 Q 900 565 1200 558 Q 1350 555 1440 552"
            stroke="#B8BDCE" strokeWidth="8" fill="none"/>
      {/* Hwy 400 — N-S Barrie corridor */}
      <rect x="690" y="0" width="7" height="580" fill="#B8BDCE"/>
      {/* QEW — curves SW from GTA */}
      <path d="M 700 578 Q 640 600 560 630 Q 460 665 360 700 Q 260 735 160 768 Q 80 792 0 810"
            stroke="#BBBFCE" strokeWidth="6" fill="none"/>
      {/* Hwy 427 / 27 N-S west GTA */}
      <rect x="580" y="380" width="5" height="200" fill="#C2C6D6"/>
      {/* Hwy 404 — east GTA N-S */}
      <rect x="790" y="0" width="5" height="580" fill="#C2C6D6"/>
      {/* Hwy 115/35 to Kingston */}
      <path d="M 790 400 Q 900 420 1000 440 Q 1080 458 1150 470 Q 1250 488 1350 500 Q 1400 506 1440 510"
            stroke="#C2C6D6" strokeWidth="5" fill="none"/>
      {/* Hwy 11 — N to Barrie/Sudbury */}
      <path d="M 690 0 Q 680 100 672 200 Q 665 280 660 350"
            stroke="#C2C6D6" strokeWidth="4" fill="none"/>
      {/* Hwy 17 — Ottawa to Sudbury */}
      <path d="M 1300 200 Q 1150 230 1000 260 Q 900 280 820 300 Q 770 315 730 330"
            stroke="#C4C8D8" strokeWidth="4" fill="none"/>
      {/* Hwy 402 — London to Sarnia */}
      <path d="M 390 568 Q 310 570 230 572 Q 160 574 80 575 Q 40 576 0 577"
            stroke="#C4C8D8" strokeWidth="4" fill="none"/>

      {/* ══ ARTERIALS ══ */}
      <rect x="0" y="220" width="1440" height="3" fill="#CCCFD9"/>
      <rect x="0" y="380" width="1440" height="2.5" fill="#D0D3DC"/>
      <rect x="0" y="480" width="700" height="2.5" fill="#D0D3DC"/>
      <rect x="0" y="680" width="1440" height="2" fill="#D4D7E0"/>
      <rect x="0" y="760" width="1440" height="2" fill="#D8DBE4"/>
      <rect x="130" y="0" width="3" height="900" fill="#D0D3DC"/>
      <rect x="320" y="0" width="2.5" height="900" fill="#CCCFD9"/>
      <rect x="480" y="0" width="2.5" height="900" fill="#D0D3DC"/>
      <rect x="870" y="0" width="2.5" height="900" fill="#D0D3DC"/>
      <rect x="1040" y="0" width="2" height="900" fill="#D4D7E0"/>
      <rect x="1200" y="0" width="2" height="900" fill="#D4D7E0"/>
      <rect x="1360" y="0" width="2" height="900" fill="#D8DBE4"/>

      {/* ══ LOCAL STREETS ══ */}
      {[120, 200, 270, 340, 430, 520, 620, 720, 820, 920, 970, 1010, 1100, 1150, 1280, 1320].map((x, i) => (
        <rect key={`v${i}`} x={x} y={0} width="1" height="900" fill="#DDE0E8" opacity="0.7"/>
      ))}
      {[80, 140, 280, 360, 440, 520, 600, 640, 700, 740, 800, 860, 920].map((y, i) => (
        <rect key={`h${i}`} x={0} y={y} width="1440" height="1" fill="#DDE0E8" opacity="0.7"/>
      ))}

      {/* ══ GREEN DELIVERY ROUTES ══ */}
      {/* Main spine: Windsor → Toronto → Ottawa */}
      <path d="M 100 576 Q 200 574 300 572 Q 390 570 480 568 Q 560 566 640 568 Q 690 570 720 572"
            stroke="#6BBF44" strokeWidth="2.5" fill="none" opacity="0.55" strokeDasharray="10 6"/>
      <path d="M 720 572 Q 850 555 980 530 Q 1080 510 1150 490 Q 1250 465 1340 440 Q 1390 428 1440 415"
            stroke="#6BBF44" strokeWidth="2.5" fill="none" opacity="0.55" strokeDasharray="10 6"/>
      {/* QEW branch to Niagara */}
      <path d="M 720 572 Q 700 600 680 630 Q 660 660 680 720 Q 700 760 730 800"
            stroke="#6BBF44" strokeWidth="2" fill="none" opacity="0.4" strokeDasharray="8 5"/>
      {/* Hwy 400 branch to Barrie/Sudbury */}
      <path d="M 695 568 Q 690 480 685 380 Q 682 300 678 200 Q 675 140 672 80"
            stroke="#6BBF44" strokeWidth="2" fill="none" opacity="0.4" strokeDasharray="8 5"/>
      {/* London → Kitchener → GTA */}
      <path d="M 390 568 Q 460 562 530 563 Q 600 564 640 566"
            stroke="#6BBF44" strokeWidth="1.8" fill="none" opacity="0.35" strokeDasharray="7 5"/>
      {/* Ottawa north loop */}
      <path d="M 1300 200 Q 1280 280 1260 360 Q 1240 420 1220 470"
            stroke="#6BBF44" strokeWidth="1.8" fill="none" opacity="0.35" strokeDasharray="7 5"/>

      {/* ══ CITY MARKERS ══ */}
      {/* Toronto — main hub */}
      <circle cx="724" cy="572" r="22" fill="#6BBF44" opacity="0.08"/>
      <circle cx="724" cy="572" r="13" fill="#6BBF44" opacity="0.15"/>
      <circle cx="724" cy="572" r="7" fill="#6BBF44" opacity="0.95"/>
      <circle cx="724" cy="572" r="3.5" fill="white" opacity="0.9"/>
      <text x="736" y="568" fontSize="9" fontWeight="700" fill="#4A6630" fontFamily="system-ui" letterSpacing="0.02em">Toronto</text>

      {/* Ottawa */}
      <circle cx="1340" cy="200" r="14" fill="#6BBF44" opacity="0.12"/>
      <circle cx="1340" cy="200" r="8" fill="#6BBF44" opacity="0.18"/>
      <circle cx="1340" cy="200" r="5" fill="#6BBF44" opacity="0.9"/>
      <circle cx="1340" cy="200" r="2.5" fill="white" opacity="0.85"/>
      <text x="1350" y="197" fontSize="8" fontWeight="600" fill="#4A6630" fontFamily="system-ui">Ottawa</text>

      {/* Hamilton */}
      <circle cx="682" cy="632" r="10" fill="#6BBF44" opacity="0.13"/>
      <circle cx="682" cy="632" r="5.5" fill="#6BBF44" opacity="0.85"/>
      <circle cx="682" cy="632" r="2.5" fill="white" opacity="0.8"/>
      <text x="692" y="629" fontSize="7.5" fill="#4A6630" fontFamily="system-ui" fontWeight="500">Hamilton</text>

      {/* Mississauga */}
      <circle cx="660" cy="590" r="4.5" fill="#6BBF44" opacity="0.8"/>
      <text x="668" y="587" fontSize="7" fill="#5A7040" fontFamily="system-ui">Mississauga</text>

      {/* Brampton */}
      <circle cx="625" cy="560" r="4" fill="#6BBF44" opacity="0.75"/>
      <text x="632" y="557" fontSize="7" fill="#5A7040" fontFamily="system-ui">Brampton</text>

      {/* Vaughan */}
      <circle cx="700" cy="520" r="4" fill="#6BBF44" opacity="0.75"/>
      <text x="708" y="517" fontSize="7" fill="#5A7040" fontFamily="system-ui">Vaughan</text>

      {/* Markham */}
      <circle cx="760" cy="540" r="4" fill="#6BBF44" opacity="0.75"/>
      <text x="768" y="537" fontSize="7" fill="#5A7040" fontFamily="system-ui">Markham</text>

      {/* Oakville */}
      <circle cx="646" cy="618" r="3.5" fill="#6BBF44" opacity="0.7"/>
      <text x="654" y="615" fontSize="7" fill="#5A7040" fontFamily="system-ui">Oakville</text>

      {/* Kitchener */}
      <circle cx="535" cy="566" r="5" fill="#6BBF44" opacity="0.8"/>
      <circle cx="535" cy="566" r="9" fill="#6BBF44" opacity="0.12"/>
      <text x="544" y="563" fontSize="7.5" fill="#4A6630" fontFamily="system-ui" fontWeight="500">Kitchener</text>

      {/* London */}
      <circle cx="395" cy="570" r="11" fill="#6BBF44" opacity="0.1"/>
      <circle cx="395" cy="570" r="6" fill="#6BBF44" opacity="0.85"/>
      <circle cx="395" cy="570" r="2.8" fill="white" opacity="0.8"/>
      <text x="405" y="567" fontSize="8" fill="#4A6630" fontFamily="system-ui" fontWeight="500">London</text>

      {/* Windsor */}
      <circle cx="105" cy="576" r="5" fill="#6BBF44" opacity="0.75"/>
      <circle cx="105" cy="576" r="9" fill="#6BBF44" opacity="0.1"/>
      <text x="114" y="573" fontSize="7.5" fill="#4A6630" fontFamily="system-ui" fontWeight="500">Windsor</text>

      {/* Barrie */}
      <circle cx="668" cy="360" r="10" fill="#6BBF44" opacity="0.12"/>
      <circle cx="668" cy="360" r="5.5" fill="#6BBF44" opacity="0.85"/>
      <circle cx="668" cy="360" r="2.5" fill="white" opacity="0.8"/>
      <text x="678" y="357" fontSize="7.5" fill="#4A6630" fontFamily="system-ui" fontWeight="500">Barrie</text>

      {/* Kingston */}
      <circle cx="1050" cy="500" r="9" fill="#6BBF44" opacity="0.1"/>
      <circle cx="1050" cy="500" r="5" fill="#6BBF44" opacity="0.8"/>
      <text x="1059" y="497" fontSize="7.5" fill="#4A6630" fontFamily="system-ui" fontWeight="500">Kingston</text>

      {/* Niagara Falls */}
      <circle cx="732" cy="740" r="4.5" fill="#6BBF44" opacity="0.75"/>
      <text x="740" y="737" fontSize="7" fill="#5A7040" fontFamily="system-ui">Niagara Falls</text>

      {/* Sudbury */}
      <circle cx="672" cy="210" r="9" fill="#6BBF44" opacity="0.1"/>
      <circle cx="672" cy="210" r="5" fill="#6BBF44" opacity="0.75"/>
      <text x="681" y="207" fontSize="7.5" fill="#4A6630" fontFamily="system-ui">Sudbury</text>

      {/* Thunder Bay */}
      <circle cx="240" cy="180" r="5" fill="#6BBF44" opacity="0.65"/>
      <text x="249" y="177" fontSize="7.5" fill="#4A6630" fontFamily="system-ui">Thunder Bay</text>

      {/* Guelph */}
      <circle cx="582" cy="548" r="4" fill="#6BBF44" opacity="0.7"/>
      <text x="590" y="545" fontSize="7" fill="#5A7040" fontFamily="system-ui">Guelph</text>

      {/* Brantford */}
      <circle cx="588" cy="615" r="3.5" fill="#6BBF44" opacity="0.65"/>
      <text x="596" y="612" fontSize="7" fill="#5A7040" fontFamily="system-ui">Brantford</text>

      {/* Sarnia */}
      <circle cx="228" cy="570" r="4" fill="#6BBF44" opacity="0.65"/>
      <text x="236" y="567" fontSize="7" fill="#5A7040" fontFamily="system-ui">Sarnia</text>

      {/* ── Intersection markers ── */}
      {[
        [690, 220], [690, 380], [690, 480], [480, 220], [480, 380],
        [320, 380], [1040, 220], [1040, 380], [1200, 380], [870, 220],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="white" stroke="#C8CBDB" strokeWidth="1"/>
      ))}

      {/* ── Compass rose ── */}
      <g transform="translate(1390 845)" opacity="0.16">
        <circle cx="0" cy="0" r="20" fill="none" stroke="#8892A8" strokeWidth="1"/>
        <line x1="0" y1="-16" x2="0" y2="16" stroke="#8892A8" strokeWidth="1"/>
        <line x1="-16" y1="0" x2="16" y2="0" stroke="#8892A8" strokeWidth="1"/>
        <polygon points="0,-16 -3,-7 3,-7" fill="#8892A8"/>
        <text x="0" y="-19" textAnchor="middle" fontSize="7" fill="#8892A8" fontFamily="sans-serif">N</text>
      </g>
    </svg>
  );
}

/* ─── Location Pin ───────────────────────────────────── */
function LocationPin({
  style, size = "md", delayClass = "pin-appear", label,
}: {
  style: React.CSSProperties;
  size?: "lg" | "md" | "sm";
  delayClass?: string;
  label?: string;
}) {
  const sizes = { lg: 14, md: 10, sm: 7 };
  const r = sizes[size];
  return (
    <div className={`absolute ${delayClass}`} style={{ ...style, transform: "translate(-50%, -50%)" }}>
      {/* Pulse rings */}
      {size !== "sm" && (
        <>
          <span
            className="absolute inset-0 rounded-full pin-ring"
            style={{
              backgroundColor: "#6BBF44",
              opacity: 0,
              transformOrigin: "center",
              width: r * 2 + 8,
              height: r * 2 + 8,
              top: -4, left: -4,
            }}
          />
          <span
            className="absolute inset-0 rounded-full pin-ring-delay"
            style={{
              backgroundColor: "#6BBF44",
              opacity: 0,
              transformOrigin: "center",
              width: r * 2 + 8,
              height: r * 2 + 8,
              top: -4, left: -4,
            }}
          />
        </>
      )}
      {/* Pin dot */}
      <div
        className="relative z-10 rounded-full border-2 border-white"
        style={{
          width: r * 2,
          height: r * 2,
          backgroundColor: "#6BBF44",
          boxShadow: "0 2px 12px rgba(107,191,68,0.5)",
        }}
      />
      {/* Label */}
      {label && (
        <span
          className="absolute left-1/2 whitespace-nowrap text-[10px] font-semibold text-navy tracking-wide"
          style={{
            top: r * 2 + 6,
            transform: "translateX(-50%)",
            fontFamily: "var(--font-outfit)",
            backgroundColor: "rgba(255,255,255,0.9)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

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
        {/* Map grid SVG fills everything */}
        <MapBackground />

        {/* Left panel — keeps text crisp, map visible on right */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to right, rgba(248,249,251,0.97) 0%, rgba(248,249,251,0.94) 32%, rgba(248,249,251,0.60) 52%, rgba(248,249,251,0.12) 68%, transparent 82%)",
          }}
        />

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex items-center" style={{ minHeight: "calc(100dvh - 72px)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center w-full py-20">

            {/* ── Left: copy ── */}
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <p
                className="reveal-1 text-xs font-semibold uppercase tracking-[0.2em] mb-8 flex items-center gap-3"
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
                  fontSize: "clamp(3rem, 6vw, 5.5rem)",
                  fontWeight: 700,
                  lineHeight: 1.0,
                  letterSpacing: "-0.04em",
                  color: "#1B3A5C",
                }}
              >
                Every appliance,<br />
                delivered and<br />
                installed{" "}
                <span style={{ color: "#6BBF44" }}>
                  right.
                </span>
              </h1>

              {/* Subline */}
              <p
                className="reveal-3 mt-7 text-lg leading-relaxed"
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
              <div className="reveal-4 mt-10 flex flex-col sm:flex-row gap-3">
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
                className="reveal-5 mt-10 text-xs tracking-wide"
                style={{ color: "#94A3B8", fontFamily: "var(--font-outfit)" }}
              >
                Trusted by Greenpark, Primont, Brookfield, Fieldgate &amp; 7 more Ontario builders
              </p>
            </div>

            {/* ── Right: transparent — lets the map shine through ── */}
            <div className="hidden lg:block relative" style={{ height: "480px" }}>
              {/* Toronto — main hub */}
              <LocationPin style={{ top: "62%", left: "44%" }} size="lg" delayClass="pin-appear" label="Toronto" />
              {/* Ottawa */}
              <LocationPin style={{ top: "18%", left: "90%" }} size="md" delayClass="pin-appear-2" label="Ottawa" />
              {/* London */}
              <LocationPin style={{ top: "64%", left: "6%" }} size="md" delayClass="pin-appear-2" label="London" />
              {/* Barrie */}
              <LocationPin style={{ top: "36%", left: "42%" }} size="sm" delayClass="pin-appear-2" />
              {/* Hamilton */}
              <LocationPin style={{ top: "76%", left: "36%" }} size="sm" delayClass="pin-appear-3" />
              {/* Kingston */}
              <LocationPin style={{ top: "54%", left: "74%" }} size="sm" delayClass="pin-appear-3" />
              {/* Kitchener */}
              <LocationPin style={{ top: "65%", left: "24%" }} size="sm" delayClass="pin-appear-3" />
              {/* Sudbury */}
              <LocationPin style={{ top: "18%", left: "43%" }} size="sm" delayClass="pin-appear-2" />
              {/* Windsor */}
              <LocationPin style={{ top: "65%", left: "-4%" }} size="sm" delayClass="pin-appear-3" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SERVICES — 2×2 tile grid
      ══════════════════════════════════════════════ */}
      <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14" data-reveal>
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
                className="group relative flex flex-col justify-between p-8 rounded-2xl overflow-hidden"
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
      <section className="py-24" style={{ backgroundColor: "#F4F5F9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 text-center" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              The Process
            </p>
            <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C" }}>
              Simple From Start To Finish
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map(({ num, title, desc }, idx) => (
              <div key={num}
                className="relative flex flex-col p-8 rounded-2xl"
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
      <section className="py-20" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(12,20,32,0.06)", borderBottom: "1px solid rgba(12,20,32,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { target: 15, suffix: "+", label: "Years in business", sub: "Founded 2009" },
              { target: 5000, suffix: "+", label: "Deliveries completed", sub: "Across Ontario" },
              { target: 10, suffix: "+", label: "Builder partners", sub: "Trusted by the best" },
            ].map(({ target, suffix, label, sub }, i) => (
              <div key={label}
                className="flex flex-col items-center text-center p-10 rounded-2xl"
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
      <section className="py-14 overflow-hidden" style={{ backgroundColor: "#ECEEF4" }}>
        <p className="text-center text-xs font-semibold uppercase mb-8 tracking-widest"
           style={{ color: "#94A3B8", fontFamily: "var(--font-outfit)" }}>
          Trusted by Ontario&apos;s Top Builders
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #ECEEF4, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
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
      <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14" data-reveal>
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
                className="group flex flex-col p-7 rounded-2xl"
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
      <section className="py-24" style={{ backgroundColor: "#F4F5F9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14" data-reveal>
            <p className="text-xs font-semibold uppercase mb-4 flex items-center gap-3"
               style={{ color: "#6BBF44", letterSpacing: "0.22em", fontFamily: "var(--font-outfit)" }}>
              <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: "#6BBF44" }} />
              Coverage
            </p>
            <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#1B3A5C" }}>
              We Deliver Across Ontario
            </h2>
          </div>

          <div className="flex flex-wrap gap-3" data-reveal data-delay="1">
            {serviceAreas.map(({ city }) => (
              <div key={city}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(12,20,32,0.08)",
                  fontFamily: "var(--font-outfit)",
                  fontSize: "14px",
                  color: "#1B3A5C",
                  fontWeight: 500,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#6BBF44", flexShrink: 0, display: "block" }} />
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS — 3 review tiles
      ══════════════════════════════════════════════ */}
      <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 text-center" data-reveal>
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
                className="flex flex-col justify-between p-8 rounded-2xl"
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
      <section className="py-28 relative overflow-hidden" style={{ backgroundColor: "#F4F5F9" }}>
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