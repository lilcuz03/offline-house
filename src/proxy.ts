import { NextResponse, type NextRequest } from "next/server";

/*
 * "Coming soon" gate. While COMING_SOON=true, every visitor sees the
 * /coming-soon page instead of the store. Turn it off by setting
 * COMING_SOON=false (or deleting the variable) in Vercel and redeploying.
 *
 * Preview the real store while the gate is on by opening
 *   https://your-site/?preview=YOUR_PREVIEW_KEY
 * once. That sets a cookie in your browser for 30 days.
 *
 * /admin and /account stay reachable so the owner can sign in, and /api stays
 * open so payment notifications and the signup form keep working.
 */

const OPEN_PREFIXES = ["/coming-soon", "/api", "/admin", "/account"];

export function proxy(request: NextRequest) {
  if (process.env.COMING_SOON?.trim() !== "true") return NextResponse.next();

  const { pathname, searchParams } = request.nextUrl;
  const key = process.env.PREVIEW_KEY?.trim();

  // Preview link: set the cookie, then drop the key from the address
  if (key && searchParams.get("preview") === key) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("preview");
    const res = NextResponse.redirect(url);
    res.cookies.set("oh_preview", key, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  if (key && request.cookies.get("oh_preview")?.value === key) {
    return NextResponse.next();
  }

  if (
    OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.rewrite(new URL("/coming-soon", request.url));
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // Skip Next.js internals and any file with an extension (images, icons, etc.)
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
