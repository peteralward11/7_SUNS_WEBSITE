import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { BookingProvider } from "@/lib/BookingContext";
import BookingModal from "@/components/BookingModal";

/* Display serif — for hero headlines only */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

/* Clean grotesque — body + UI */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "7 Suns Delivery & Logistics | Ontario's Appliance Specialists",
  description:
    "Professional appliance delivery and installation across Ontario. Serving residential and commercial clients since 2009. Trusted by Ontario's top builders.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col text-white" style={{ backgroundColor: "#0C1420" }}>
        <BookingProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <BookingModal />
        </BookingProvider>
      </body>
    </html>
  );
}
