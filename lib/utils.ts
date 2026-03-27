export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) =>
      ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .concat("-", Math.random().toString(36).slice(2, 8));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatLifespan(
  birth: string | null,
  death: string | null
): string {
  const b = birth ? new Date(birth).getFullYear() : "?";
  const d = death ? new Date(death).getFullYear() : "";
  if (!birth && !death) return "";
  return d ? `${b} – ${d}` : `* ${b}`;
}
