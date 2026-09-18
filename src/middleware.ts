import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";

const LOCALE_RE = new RegExp(`^/(${routing.locales.join("|")})(/|$)`);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pref = request.cookies.get("NEXT_LOCALE")?.value;
  if (pref && (routing.locales as readonly string[]).includes(pref)) {
    const m = pathname.match(LOCALE_RE);
    const current = m?.[1];
    if (!current) {
      return NextResponse.redirect(
        new URL(pathname === "/" ? `/${pref}` : `/${pref}${pathname}`, request.url),
      );
    }
    if (current !== pref) {
      const rest = pathname.slice(current.length + 1);
      return NextResponse.redirect(new URL(`/${pref}/${rest}`, request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|api/|d/|img/|favicon.ico|robots.txt$|sitemap.xml$|.*\\.(?:png|jpg|jpeg|svg|webp|pdf|css|js|txt|xml|ico)$).*)",
  ],
};