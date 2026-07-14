import Link from "next/link";

// Würdevoller Leer-Zustand (01_DESIGN_SYSTEM / A8): Ornament, einfühlsamer
// Satz, genau EINE klare Aktion.
export default function EmptyState({
  icon = "potted_plant",
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="bg-card rounded-card border border-outline-variant/30 p-10 lg:p-16 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary/80 text-3xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className="font-headline text-xl lg:text-2xl text-on-surface mb-3">{title}</h3>
      <p className="text-on-surface-variant text-sm lg:text-base mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-6 py-3.5 lg:px-8 lg:py-4 rounded-button hover:brightness-110 active:scale-[.98] transition-all duration-250 ease-out shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
