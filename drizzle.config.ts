import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit CLI không tự load .env.local như Next.js — tự parse để lấy DATABASE_URL
function loadEnvFile(path: string): void {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

loadEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Create .env.local from .env.example before running drizzle-kit."
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
