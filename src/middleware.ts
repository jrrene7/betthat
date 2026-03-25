import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit store (per serverless instance)
// For multi-instance production, replace with Upstash Redis
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute sliding window
const LIMITS = {
  auth: 10,  // stricter for auth routes
  api: 100,  // general API
};

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function rateLimit(
  key: string,
  limit: number
): { allowed: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0, remaining: limit - entry.count };
}

// Periodically prune expired entries to prevent memory growth
function maybePrune() {
  if (Math.random() > 0.02) return; // run ~2% of requests
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now >= val.resetAt) store.delete(key);
  }
}

// Known scraper/harvester user-agent patterns
const BOT_UA_RE =
  /(?:scrapy|ahrefsbot|semrushbot|dotbot|mj12bot|blexbot|masscan|zgrab|nuclei)/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  maybePrune();

  // ── Honeypot trap ──────────────────────────────────────────────────────────
  // Any request to /api/trap is a bot/scanner; block silently
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
    const ip = getIp(req);
    const isAuth = pathname.startsWith("/api/auth/");
    const limit = isAuth ? LIMITS.auth : LIMITS.api;
    const key = `${ip}:${isAuth ? "auth" : "api"}`;

    const { allowed, retryAfter, remaining } = rateLimit(key, limit);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(limit));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // All routes except static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
