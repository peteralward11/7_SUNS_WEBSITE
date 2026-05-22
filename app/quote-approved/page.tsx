export default function QuoteApprovedPage() {
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#f9fafb",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: 480, width: "100%", backgroundColor: "#ffffff",
        borderRadius: 16, padding: "48px 40px", textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          backgroundColor: "rgba(30,126,74,0.1)", border: "1.5px solid rgba(30,126,74,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
            <path d="M2 10L8.5 17L24 2" stroke="#1E7E4A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1E7E4A", marginBottom: 12 }}>
          Quote Approved
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 14 }}>
          You&apos;re all set!
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 32 }}>
          Your quote has been approved. Our team will be in touch shortly to confirm your delivery date and time.
        </p>

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 24 }}>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Questions? Email us at{" "}
            <a href="mailto:info@7suns.ca" style={{ color: "#1E7E4A", textDecoration: "none", fontWeight: 600 }}>
              info@7suns.ca
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
