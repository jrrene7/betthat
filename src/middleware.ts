import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// ── Rate limiters (Upstash Redis) ──────────────────────────────────────────
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
// Falls back to a no-op if not configured (e.g. local dev without Redis).

let apiLimiter: Ratelimit | null = null;
let authLimiter: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // General API: 100 requests per 60 seconds per IP
  apiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    prefix: "rl:api",
    analytics: true,
  });

  // Auth routes: 10 requests per 60 seconds per IP (stricter)
  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:auth",
    analytics: true,
  });
}

// Known scraper / scanner user-agent patterns
const BOT_UA_RE =
  /(?:scrapy|ahrefsbot|semrushbot|dotbot|mj12bot|blexbot|masscan|zgrab|nuclei)/i;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Honeypot trap ──────────────────────────────────────────────────────────
  if (pathname === "/api/trap") {
    return new NextResponse(null, { status: 404 });
  }

  // ── Bot user-agent detection ───────────────────────────────────────────────
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA_RE.test(ua) && pathname.startsWith("/api/")) {
    return new NextResponse(null, { status: 403 });
  }

  // ── Rate limiting (API routes only) ────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const isAuth = pathname.startsWith("/api/auth/");
    const limiter = isAuth ? authLimiter : apiLimiter;

    if (limiter) {
      const ip = getIp(req);
      const { success, limit, remaining, reset } = await limiter.limit(ip);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please slow down." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(reset),
            },
          }
        );
      }

      const res = NextResponse.next();
      res.headers.set("X-RateLimit-Limit", String(limit));
      res.headers.set("X-RateLimit-Remaining", String(remaining));
      res.headers.set("X-RateLimit-Reset", String(reset));
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
