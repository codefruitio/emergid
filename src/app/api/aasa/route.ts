import { NextResponse } from "next/server";

export const dynamic = "force-static";

const AASA = {
  webcredentials: {
    apps: ["5978XLQ85J.codefruit.emergID"],
  },
};

export function GET() {
  return new NextResponse(JSON.stringify(AASA), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
