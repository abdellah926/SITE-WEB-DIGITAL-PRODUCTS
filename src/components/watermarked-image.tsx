"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";

export function WatermarkedImage(props: ImageProps & { light?: boolean }) {
  const { className, alt, light, ...rest } = props;
  const watermarkOverlay = light ? null : (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 14px, rgba(120,80,20,0.06) 14px 28px)",
      }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: "rotate(-28deg)",
          fontSize: "1.6rem",
          fontWeight: 700,
          letterSpacing: "0.35em",
          color: "rgba(90,60,15,0.22)",
          textShadow: "0 1px 2px rgba(255,255,255,0.35)",
        }}
      >
        Crochet&nbsp;&amp;&nbsp;Handmade
      </span>
    </div>
  );
  return (
    <div
      className={`relative select-none ${className ?? ""}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {watermarkOverlay}
      <Image alt={alt} draggable={false} className={className} {...rest} />
    </div>
  );
}