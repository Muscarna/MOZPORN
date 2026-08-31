import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mozporn_session";

function key() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/creator") ||
    pathname.startsWith("/admin");

  if (!protectedPath) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, key());
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/creator/:path*", "/admin/:path*"],
};
