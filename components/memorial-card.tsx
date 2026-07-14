import Link from "next/link";
import Image from "next/image";
import { formatLifespan } from "@/lib/utils";
import type { Memorial } from "@/lib/types";

export default function MemorialCard({
  memorial,
  diaryCount,
}: {
  memorial: Memorial;
  diaryCount: number;
}) {
  const m = memorial;
  return (
    <Link
      href={`/memorial/${m.id}`}
      className="group block bg-card hover:bg-card-hover rounded-card border-l-4 border-primary p-6 lg:p-8 shadow-xl transition-colors duration-250 ease-out"
    >
      <div className="flex justify-between items-start mb-6 lg:mb-8">
        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden ring-1 ring-primary/20 bg-background flex items-center justify-center">
          {m.profile_photo_url ? (
            <Image
              src={m.profile_photo_url}
              alt={m.name}
              width={80}
              height={80}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-400 ease-out"
            />
          ) : (
            <span className="material-symbols-outlined text-primary/70 text-3xl" aria-hidden="true">
              {m.type === "animal" ? "pets" : "potted_plant"}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1.5 rounded-full ${
            m.is_public
              ? "text-primary bg-primary/10"
              : "text-on-surface-variant/70 bg-surface-container"
          }`}
        >
          {m.is_public ? "Aktiv" : "Privat"}
        </span>
      </div>
      <h3 className="font-headline text-2xl lg:text-3xl text-on-surface mb-1.5">{m.name}</h3>
      <p className="text-on-surface-variant text-sm lg:text-base font-body mb-6 lg:mb-8">
        {formatLifespan(m.birth_date, m.death_date) || "Keine Daten"}
      </p>
      <div className="flex items-center gap-6 text-on-surface-variant text-xs">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">menu_book</span>
          {diaryCount} Einträge
        </span>
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">visibility</span>
          {m.is_public ? "Geteilt" : "Privat"}
        </span>
      </div>
    </Link>
  );
}
