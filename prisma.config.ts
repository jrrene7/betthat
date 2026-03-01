import { defineConfig, env } from "prisma/config";

try {
  (process as any).loadEnvFile?.();
} catch (error: unknown) {
  const err = error as NodeJS.ErrnoException;
  if (err?.code !== "ENOENT") {
    throw error;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
