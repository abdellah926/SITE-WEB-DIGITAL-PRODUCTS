"use client";

import { useState } from "react";
import Link from "next/link";
import { WatermarkedImage } from "./watermarked-image";

export function ProductImages({ images, title, href, compact = false }: {
  images: string[];
  title: string;
  href?: string;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const photos = images.length ? images : ["/img/crochet-blanket.svg"];
  const main = (
    <WatermarkedImage
      src={photos[selected] ?? photos[0]}
      alt={title}
      width={800}
      height={900}
      sizes={compact ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
      className={`w-full bg-stone-50 object-contain ${compact ? "h-64" : "h-[34rem] rounded-2xl"}`}
    />
  );
  return (
    <div className="min-w-0">
      {href ? <Link href={href} className="block">{main}</Link> : main}
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-2 p-3">
          {photos.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={`${title} — ${index + 1} / ${photos.length}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${selected === index ? "border-amber-700" : "border-stone-200 hover:border-amber-400"}`}
            >
              <WatermarkedImage light src={src} alt="" width={64} height={72} sizes="64px" className="h-16 w-14 bg-stone-50 object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
