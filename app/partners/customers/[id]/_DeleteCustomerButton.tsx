"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCustomerButton({ email }: { email: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "deleting">("idle");

  async function handleDelete() {
    setState("deleting");
    await fetch(`/api/partners/customers/${encodeURIComponent(email)}`, { method: "DELETE" });
    router.push("/partners/customers");
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("confirm")}
        style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "#B44A2C", cursor: "pointer", textDecoration: "underline" }}
      >
        Delete customer…
      </button>
    );
  }

  if (state === "confirm") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "12px", color: "var(--text-2)" }}>Delete all jobs and data for this customer?</span>
        <button
          onClick={handleDelete}
          style={{ padding: "4px 12px", backgroundColor: "#B44A2C", border: "none", borderRadius: 6, fontSize: "11px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          Yes, Delete
        </button>
        <button
          onClick={() => setState("idle")}
          style={{ padding: "4px 10px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 6, fontSize: "11px", color: "var(--text-3)", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return <span style={{ fontSize: "12px", color: "var(--text-3)" }}>Deleting…</span>;
}
