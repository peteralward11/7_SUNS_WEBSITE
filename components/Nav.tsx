"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useBooking } from "@/lib/BookingContext";

const links = [
  { label: "Home",           href: "/" },
  { label: "Services",       href: "/services" },
  { label: "About Us",       href: "/about" },
  { label: "Why Choose Us",  href: "/why-choose-us" },
  { label: "Contact",        href: "/contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { open: openBooking } = useBooking();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Fisher & Paykel is a standalone landing page — no header at all
  if (pathname === "/fisher-paykel") return null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[background,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "bg-navy/95 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-white/75 backdrop-blur-md border-b border-black/[0.06]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8"
             style={{ height: "88px" }}>

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green rounded-sm"
          >
            <Image
              src={scrolled ? "/logo-dark.png" : "/logo-transparent.png"}
              alt="7 Suns Delivery & Logistics"
              width={220}
              height={80}
              className="h-16 w-auto object-contain transition-opacity duration-300"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green
                    active:scale-95
                    ${active
                      ? "text-green"
                      : scrolled
                        ? "text-muted hover:text-white hover:bg-white/[0.06]"
                        : "text-navy hover:text-navy-border hover:bg-black/[0.04]"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Book Now CTA */}
          <button
            onClick={openBooking}
            className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green text-navy font-semibold text-sm
              transition-[transform,box-shadow,background-color] duration-200
              hover:bg-green-light hover:shadow-green hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-navy
              active:translate-y-0 active:shadow-none"
          >
            Book Now
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-md
              hover:bg-white/[0.06] transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
          >
            <span className={`block h-0.5 w-5 rounded-full transition-[transform,opacity,background-color] duration-300 ${scrolled ? "bg-white" : "bg-navy"} ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full transition-[opacity,background-color] duration-300 ${scrolled ? "bg-white" : "bg-navy"} ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full transition-[transform,opacity,background-color] duration-300 ${scrolled ? "bg-white" : "bg-navy"} ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" />
      </div>
      <nav
        className={`fixed top-[88px] left-0 right-0 z-40 lg:hidden bg-navy-surface border-b border-white/[0.06]
          transition-[transform,opacity] duration-300
          ${open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
          {links.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green
                  active:scale-95
                  ${active ? "text-green bg-white/[0.04]" : "text-muted hover:text-white hover:bg-white/[0.06]"}`}
              >
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => { openBooking(); setOpen(false); }}
            className="mt-3 px-4 py-3 rounded-lg bg-green text-navy font-semibold text-sm text-center
              hover:bg-green-light transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green
              active:scale-95"
          >
            Book Now
          </button>
        </div>
      </nav>
    </>
  );
}
