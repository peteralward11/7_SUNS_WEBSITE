"use client";
import { useRef, useState } from "react";

interface Photo {
  id: string;
  url: string;
  uploaded_by: string | null;
  created_at: string;
}

async function compressImage(file: File, maxPx = 2048, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxPx && height <= maxPx) { resolve(file); return; }
      if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
      else { width = Math.round(width * maxPx / height); height = maxPx; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file);
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function PhotoGallery({
  bookingId,
  photos: initialPhotos,
  isAdmin,
  onPhotosChange,
}: {
  bookingId: string;
  photos: Photo[];
  isAdmin: boolean;
  onPhotosChange?: (photos: Photo[]) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  function updatePhotos(next: Photo[]) {
    setPhotos(next);
    onPhotosChange?.(next);
  }
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      let current = [...photos];
      for (const rawFile of Array.from(files)) {
        const file = await compressImage(rawFile);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("booking_id", bookingId);
        const res = await fetch("/api/partners/photos", { method: "POST", body: fd });
        let data: { photo?: unknown; error?: string } = {};
        try { data = await res.json(); } catch { data = {}; }
        if (data.photo) {
          current = [...current, data.photo as Photo];
          updatePhotos(current);
        } else {
          setError(data.error ?? `Upload failed (${res.status}) — please try again.`);
        }
      }
    } catch (e) {
      setError("Network error — please check your connection and try again.");
      console.error("[photos] upload exception:", e);
    }

    if (inputRef.current) inputRef.current.value = "";
    setUploading(false);
  }

  async function deletePhoto(id: string) {
    const next = photos.filter(x => x.id !== id);
    updatePhotos(next);
    await fetch(`/api/partners/photos/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase", margin: 0 }}>
          Photos ({photos.length})
        </p>
        {isAdmin && (
          <>
            <button
              onClick={() => { setError(null); inputRef.current?.click(); }}
              disabled={uploading}
              style={{
                backgroundColor: uploading ? "var(--border)" : "var(--text)",
                color: uploading ? "var(--text-3)" : "var(--bg)",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: uploading ? "default" : "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {uploading ? "Uploading…" : "+ Add Photos"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={e => handleFiles(e.target.files)}
            />
          </>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: "#B44A2C18", border: "1px solid #B44A2C44", borderRadius: 6, padding: "8px 12px", marginBottom: 10 }}>
          <p style={{ fontSize: "12px", color: "#B44A2C", margin: 0 }}>{error}</p>
        </div>
      )}

      {photos.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>No photos attached.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {photos.map(photo => (
            <div key={photo.id} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 6, border: "1px solid var(--border)" }}>
              <img
                src={photo.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                onClick={() => setLightbox(photo.url)}
              />
              {isAdmin && (
                <button
                  onClick={() => deletePhoto(photo.id)}
                  title="Delete photo"
                  style={{
                    position: "absolute", top: 4, right: 4,
                    width: 22, height: 22, borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.7)", border: "none",
                    color: "#FFFFFF", fontSize: "12px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fp-backdrop"
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button
            onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 16, right: 16, backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#FFFFFF", fontSize: "20px", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
