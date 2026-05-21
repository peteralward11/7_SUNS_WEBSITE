"use client";
import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPartners = pathname.startsWith("/partners");

  if (isPartners) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
      <BookingModal />
    </>
  );
}
