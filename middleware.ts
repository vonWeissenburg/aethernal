import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // robots.txt und sitemap.xml muessen ausgenommen sein: Sonst faengt die
    // Middleware sie ab und leitet Unangemeldete zur Login-Seite um. Eine
    // Suchmaschine bekam dadurch HTTP 200 mit HTML statt der robots.txt —
    // das liest sie als "keine Einschraenkungen". Befund 11.09.2026.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
