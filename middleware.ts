import { NextResponse, type NextRequest } from "next/server";
import { getUserFromMiddleware } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await getUserFromMiddleware(request);

  const isAppRoute = request.nextUrl.pathname.startsWith("/app");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/auth/:path*"]
};