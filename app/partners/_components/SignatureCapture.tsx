"use client";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignatureCapture({
  bookingId,
  signatureUrl: initialUrl,
  onSaved,
}: {
  bookingId: string;
  signatureUrl: string | null;
  onSaved: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const canvasRef = useRef<SignatureCanvas>(null);

  function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function save() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return;
    setSaving(true);
    setSaveError(null);

    const dataUrl = canvasRef.current.toDataURL("image/png");
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], "signature.png", { type: "image/png" });

    const fd = new FormData();
    fd.append("file", file);
    fd.append("booking_id", bookingId);

    const res = await fetch("/api/partners/signature", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setUrl(data.url);
      onSaved(data.url);
      setOpen(false);
    } else {
      setSaveError(data.error ?? "Save failed — please try again.");
    }
    setSaving(false);
  }

  return (
    <div>
      <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 10px" }}>
        Customer Signature
      </p>

      {url ? (
        <div>
          <img
            src={url}
            alt="Customer signature"
            style={{ maxWidth: "100%", border: "1px solid var(--border)", borderRadius: 6, backgroundColor: "#FFFFFF", padding: 8 }}
          />
          <button
            onClick={() => setOpen(true)}
            style={{
              marginTop: 8,
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Re-collect signature
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            backgroundColor: "var(--text)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Collect Signature
        </button>
      )}

      {open && (
        <div
          className="fp-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 24,
            width: "min(95vw, 480px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111111", margin: 0 }}>
                Customer Signature
              </p>
              <button
                onClick={() => setOpen(false)}
                style={{ backgroundColor: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#7A7A7A" }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#7A7A7A", margin: "0 0 12px" }}>
              Have the customer sign below using their finger or stylus.
            </p>
            <div style={{ border: "1px solid #D9D9D9", borderRadius: 8, overflow: "hidden", touchAction: "none" }}>
              <SignatureCanvas
                ref={canvasRef}
                canvasProps={{ width: 430, height: 200, style: { width: "100%", height: 200, display: "block" } }}
                backgroundColor="#FFFFFF"
                penColor="#111111"
              />
            </div>
            {saveError && (
              <p style={{ fontSize: "12px", color: "#B44A2C", margin: "8px 0 0", backgroundColor: "#B44A2C18", padding: "8px 10px", borderRadius: 6 }}>
                {saveError}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => canvasRef.current?.clear()}
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  border: "1px solid #D9D9D9",
                  borderRadius: 6,
                  padding: "10px",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "#5A5A5A",
                }}
              >
                Clear
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  flex: 2,
                  backgroundColor: saving ? "#D9D9D9" : "#111111",
                  color: saving ? "#7A7A7A" : "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
