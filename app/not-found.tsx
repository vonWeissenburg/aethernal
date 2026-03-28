import Link from "next/link";

export const metadata = { title: "Nicht gefunden" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf7] px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🕊️</div>
        <h1 className="text-4xl font-serif font-semibold text-violet mb-3">
          404
        </h1>
        <p className="text-lg text-aether-gray mb-8">
          Diese Seite existiert nicht.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-violet px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-light transition shadow-sm"
        >
          Zum Dashboard
        </Link>
        <p className="mt-6 text-xs text-aether-gray">
          <Link
            href="https://aethernal.me"
            className="text-amber hover:text-amber-dark transition"
          >
            aethernal.me
          </Link>
        </p>
      </div>
    </div>
  );
}
