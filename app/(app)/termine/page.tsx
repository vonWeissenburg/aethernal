import Link from "next/link";

export const metadata = { title: "Termine" };

export default function TerminePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="rounded-2xl border border-lavender-dark bg-white p-12 text-center">
        <div className="text-5xl mb-6">📅</div>
        <h1 className="text-3xl font-serif font-semibold text-violet mb-3">
          Termine
        </h1>
        <p className="text-aether-gray max-w-md mx-auto mb-2">
          Gedenktage, Jahrestage und besondere Daten, die automatisch erinnert
          werden.
        </p>
        <div className="inline-block mt-4 mb-6 text-xs bg-amber/10 text-amber px-3 py-1.5 rounded-full font-medium">
          Verfügbar ab Q3 2026
        </div>
        <div className="border-t border-lavender-dark pt-6">
          <p className="text-sm text-aether-gray">
            Du wirst benachrichtigt, sobald dieses Feature verfügbar ist.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 text-sm text-amber hover:text-amber-dark transition"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
