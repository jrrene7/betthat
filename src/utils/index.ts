export const PRODUCTION = process.env.NODE_ENV === "production";

export const BASE_URL = PRODUCTION
  ? process.env.VERCEL_URL
  : "http://localhost:3000";
