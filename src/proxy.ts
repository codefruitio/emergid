import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const proto = request.headers.get("x-forwarded-proto");
  if (proto && proto !== "https") {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/e/:path*", "/api/card/:path*"],
};
