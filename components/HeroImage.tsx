import React from "react";

interface HeroImageProps {
  src: string;
  objectPosition?: string;
  /** RGB triplet matching the page background, e.g. "244,245,249" or "248,249,251" */
  overlayRgb?: string;
  /** Extra Tailwind classes on the wrapper — use for z-index when other layers are present */
  className?: string;
}

export default function HeroImage({
  src,
  objectPosition = "center center",
  overlayRgb = "244,245,249",
  className = "",
}: HeroImageProps) {
  const css = `
    .hero-img {
      position: absolute;
      right: 0; top: 0;
      height: 100%; width: 62%;
      object-fit: cover;
      -webkit-mask-image:
        linear-gradient(to right, transparent 0%, black 30%, black 100%),
        linear-gradient(to bottom, transparent 0%, black 14%, black 55%, transparent 100%);
      -webkit-mask-composite: destination-in;
      mask-image:
        linear-gradient(to right, transparent 0%, black 30%, black 100%),
        linear-gradient(to bottom, transparent 0%, black 14%, black 55%, transparent 100%);
      mask-composite: intersect;
    }
    @media (max-width: 639px) {
      .hero-img {
        width: 100%;
        left: 0;
        -webkit-mask-image:
          linear-gradient(to bottom, transparent 0%, black 12%, black 58%, transparent 100%);
        -webkit-mask-composite: source-over;
        mask-image:
          linear-gradient(to bottom, transparent 0%, black 12%, black 58%, transparent 100%);
        mask-composite: add;
      }
    }
  `;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      <style>{css}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="hero-img"
        style={{ objectPosition }}
      />
      {/* Mobile: gradient heavy on text side, fading to let image breathe on the right */}
      <div
        className="absolute inset-0 sm:hidden"
        style={{
          background: `linear-gradient(to right, rgba(${overlayRgb},0.96) 0%, rgba(${overlayRgb},0.92) 40%, rgba(${overlayRgb},0.72) 65%, rgba(${overlayRgb},0.25) 100%)`,
        }}
      />
    </div>
  );
}
