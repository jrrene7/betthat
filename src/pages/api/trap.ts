import type { NextApiRequest, NextApiResponse } from "next";
import logger from "src/server/logger";

/**
 * Honeypot endpoint — never linked in the UI.
 * Any request here is from a bot/scanner crawling href attributes.
 * Middleware returns 404 for this path; this handler is a fallback.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  logger.warn("Honeypot triggered", {
    ip,
    method: req.method,
    userAgent: req.headers["user-agent"],
  });

  res.status(404).end();
}
