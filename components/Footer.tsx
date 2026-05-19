"use client";

import Link from "next/link";
import Image from "next/image";
import { useBooking } from "@/lib/BookingContext";

const navLinks = [
  { label: "Home",          href: "/" },
  { label: "Services",      href: "/services" },
  { label: "About Us",      href: "/about" },
  { label: "Why Choose Us", href: "/why-choose-us" },
  { label: "Contact",       href: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const { open } = useBooking();

  return (
    <footer className="bg-navy-surface border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green rounded-sm">
              <Image
                src="/logo.png"
                alt="7 Suns Delivery & Logistics"
                width={140}
                height={50}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              Ontario&apos;s appliance delivery and installation specialists. Delivered right. Installed right. Since 2009.
            </p>
            <a
              href="mailto:info@7Suns.ca"
              className="inline-block mt-4 text-sm text-green hover:text-green-light transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green rounded-sm"
            >
              info@7Suns.ca
            </a>
          </div>

          {/* Nav links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-subtle mb-4">Navigation</p>
            <ul className="flex flex-col gap-2">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted hover:text-white transition-colors duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA column */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-subtle mb-4">Ready to Book?</p>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Schedule your appliance delivery or installation with Ontario&apos;s most trusted team.
            </p>
            <button
              onClick={open}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green text-navy font-semibold text-sm
                transition-[transform,box-shadow,background-color] duration-200
                hover:bg-green-light hover:shadow-green hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green
                active:translate-y-0"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-subtle">
          <p>&copy; {year} 7 Suns Delivery &amp; Logistics Inc. All rights reserved.</p>
          <Link
            href="/privacy-policy"
            className="hover:text-muted transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green rounded-sm"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
