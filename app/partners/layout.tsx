import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fisher & Paykel | Friends & Family Delivery Portal",
  description: "Delivery and installation partner portal.",
  robots: "noindex, nofollow",
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        style={{
          fontFamily: "var(--font-inter), 'Helvetica Neue', Helvetica, Arial, sans-serif",
          backgroundColor: "#F5F5F2",
          color: "#111111",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
