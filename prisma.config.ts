import { defineConfig, env } from "prisma/config";

(process as any).loadEnvFile?.();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
