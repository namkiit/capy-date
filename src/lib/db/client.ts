import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Pool cache trên globalThis để hot-reload của Next dev không tạo pool mới mỗi lần
 * (pattern chuẩn cho Prisma/Drizzle trong Next.js).
 */
const globalForDb = globalThis as unknown as { capyDbPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — tạo .env.local từ .env.example (local: docker compose up -d)"
    );
  }
  return new Pool({ connectionString, max: 5 });
}

const pool = globalForDb.capyDbPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalForDb.capyDbPool = pool;
}

export const db = drizzle(pool, { schema });
