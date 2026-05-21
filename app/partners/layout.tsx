import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fisher & Paykel | Friends & Family Delivery Portal",
  description: "Delivery and installation partner portal.",
  robots: "noindex, nofollow",
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      backgroundColor: "#F5F5F2",
      color: "#111111",
      minHeight: "100vh",
    }}>
      {children}
    </div>
  );
}
