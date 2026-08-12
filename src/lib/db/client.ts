import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Pool khởi tạo LAZY (lần gọi getDb đầu tiên) — import file này không đụng DB,
 * để test/pure module import được tầng queries mà không cần DATABASE_URL.
 * Pool cache trên globalThis để hot-reload của Next dev không tạo pool mới mỗi lần.
 */
const globalForDb = globalThis as unknown as { capyDbPool?: Pool };

export type Db = NodePgDatabase<typeof schema>;

let dbInstance: Db | null = null;

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — tạo .env.local từ .env.example (local: docker compose up -d)"
    );
  }
  return new Pool({ connectionString, max: 5 });
}

export function getDb(): Db {
  if (dbInstance === null) {
    const pool = globalForDb.capyDbPool ?? createPool();
    if (process.env.NODE_ENV !== "production") {
      globalForDb.capyDbPool = pool;
    }
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}
