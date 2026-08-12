# Capy Date? 🍊

Website mời đi hẹn hò — form 1 trang kiểu "campaign brief" (progressive disclosure) + admin panel cho host cấu hình lịch, quán/phim/cafe, nội dung và xem submission. Next.js 16 · TypeScript · Tailwind v4 · Drizzle/Postgres · motion.

## Chạy local

```bash
docker compose up -d        # Postgres cổng 5434
cp .env.example .env.local  # điền giá trị
npm install
npm run db:migrate && npm run db:seed
npm run dev                 # http://localhost:3000 — admin: /admin
```

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run lint` / `typecheck` / `test` | kiểm chứng (vitest) |
| `npm run db:generate` → `db:migrate` | tạo + chạy migration (Drizzle) |
| `npm run db:seed` | seed options placeholder (idempotent) |
| `npm run db:studio` | xem DB bằng Drizzle Studio |

## Deploy

Xem [DEPLOY.md](./DEPLOY.md) — Vercel + Neon + Blob + Resend, từng bước.
