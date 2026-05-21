"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/partners/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (res.ok) {
      setStatus("sent");
    } else {
      const data = await res.json();
      setErrorMsg(data.error || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#111111", display: "flex", flexDirection: "column" }}>
      {/* Masthead */}
      <header style={{
        backgroundColor: "#111111",
        borderBottom: "1px solid #3A3A3A",
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ color: "#FFFFFF", fontSize: "12pt", fontWeight: 700, letterSpacing: "0.06em" }}>
            FISHER &amp; PAYKEL
          </div>
          <div style={{ color: "#7A7A7A", fontSize: "9pt", letterSpacing: "0.04em", marginTop: 2 }}>
            Friends &amp; Family Delivery Portal
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#FFFFFF", fontSize: "10pt", fontWeight: 700, letterSpacing: "0.04em" }}>
            7SUNS
          </div>
          <div style={{ color: "#B8B8B8", fontSize: "7.5pt", letterSpacing: "0.04em", marginTop: 1 }}>
            DELIVERY &amp; INSTALLATION PARTNER
          </div>
          <div style={{ height: "1.8px", backgroundColor: "#E8A33D", marginTop: 3 }} />
        </div>
      </header>

      {/* Login card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D9D9D9",
          maxWidth: 400,
          width: "100%",
          padding: "48px",
        }}>
          {status === "sent" ? (
            <>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: 8 }}>
                Check your inbox.
              </p>
              <p style={{ fontSize: "16px", color: "#3A3A3A", lineHeight: 1.6, margin: 0 }}>
                A sign-in link has been sent to <strong>{email}</strong>. Open it on any device to access the portal.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#5A5A5A", textTransform: "uppercase", margin: "0 0 16px" }}>
                Partner Access
              </p>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111111", margin: "0 0 8px", lineHeight: 1.2 }}>
                Sign in
              </h1>
              <p style={{ fontSize: "16px", color: "#3A3A3A", lineHeight: 1.5, margin: "0 0 32px" }}>
                Enter your authorised email address and we will send you a sign-in link.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: 8 }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "16px",
                    border: "1px solid #D9D9D9",
                    outline: "none",
                    color: "#111111",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                    marginBottom: 24,
                  }}
                />

                {status === "error" && (
                  <p style={{ fontSize: "14px", color: "#B44A2C", marginBottom: 16 }}>{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 24px",
                    backgroundColor: status === "loading" ? "#3A3A3A" : "#111111",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    height: 38,
                  }}
                >
                  {status === "loading" ? "Sending…" : "Send Sign-In Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #3A3A3A",
        padding: "16px 40px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "8.5pt", color: "#5A5A5A", margin: 0 }}>
          © Fisher &amp; Paykel Appliances Ltd · Delivery &amp; installation by 7suns, an authorised Fisher &amp; Paykel partner. Engineered for Life. Est. 1934.
        </p>
      </footer>
    </div>
  );
}
