"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// Klickbare Foto-Galerie mit Lightbox (Backlog A3/A4).
// variant "grid"  = Kachel-Raster (Gedenkprofil-Detail)
// variant "strip" = horizontaler Snap-Streifen / Desktop-Grid (SpiritLink)

export interface LightboxPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export function LightboxGallery({
  photos,
  variant,
}: {
  photos: LightboxPhoto[];
  variant: "grid" | "strip";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length
      );
    },
    [photos.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  const open = photos[openIndex ?? -1];

  return (
    <>
      {variant === "grid" ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Foto vergrößern${photo.caption ? `: ${photo.caption}` : ""}`}
              className="group relative aspect-square rounded-button overflow-hidden bg-surface-container-high cursor-zoom-in focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? ""}
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-400 ease-out"
                sizes="(max-width: 640px) 33vw, 25vw"
              />
              {photo.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-label text-white truncate">
                  {photo.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 hide-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Foto vergrößern${photo.caption ? `: ${photo.caption}` : ""}`}
              className="group relative flex-shrink-0 w-48 lg:w-auto aspect-[3/4] rounded-card overflow-hidden bg-surface shadow-xl cursor-zoom-in focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? ""}
                width={320}
                height={427}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-400 ease-out"
              />
              {photo.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-[11px] font-body text-white/90 text-left">
                  {photo.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.caption ?? "Foto-Ansicht"}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          <figure
            className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox zeigt das Original in voller Auflösung */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt={open.caption ?? ""}
              className="max-w-full max-h-[80vh] object-contain rounded-card shadow-2xl"
            />
            {open.caption && (
              <figcaption className="mt-3 text-center text-sm font-body text-white/85">
                {open.caption}
              </figcaption>
            )}
          </figure>

          <button
            type="button"
            onClick={close}
            aria-label="Schließen"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-250 ease-out"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                aria-label="Vorheriges Foto"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-250 ease-out"
              >
                <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                aria-label="Nächstes Foto"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-250 ease-out"
              >
                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
