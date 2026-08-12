# Hướng dẫn deploy Capy Date? lên Vercel

Toàn bộ các bước bạn tự làm trên trình duyệt (~15 phút). Miễn phí 100% với free tier.

## 1. Đẩy code lên GitHub

```powershell
# PowerShell — tạo repo PRIVATE trên github.com trước, rồi:
cd C:\Workspace\Outsource\capy-date
git remote add origin https://github.com/<username>/capy-date.git
git push -u origin master
```

> Repo **private** — đây là site cá nhân.

## 2. Tạo project Vercel

1. Vào [vercel.com](https://vercel.com) → **Add New → Project** → import repo `capy-date`.
2. Framework tự nhận Next.js — giữ nguyên mọi setting build, **khoan bấm Deploy** (thiếu env sẽ lỗi; nếu lỡ deploy fail cũng không sao, thêm env xong redeploy).

## 3. Tạo database Neon (thay cho Docker Postgres local)

*Vì sao Neon: Vercel không có Postgres riêng nữa (ngừng 6/2025), Neon là Postgres serverless tích hợp thẳng vào Vercel Marketplace — connection string tự thêm vào env.*

1. Trong project Vercel → tab **Storage** → **Create Database** → chọn **Neon** → region Singapore (gần VN nhất) → Create.
2. Vercel tự thêm biến `DATABASE_URL` vào project (Connect → chọn cả Production/Preview/Development).
3. Chạy migration + seed từ máy local vào Neon:

```powershell
# PowerShell, trong thư mục capy-date
# Lấy connection string: Vercel → Storage → Neon → .env.local tab → copy DATABASE_URL
# Tạm thời sửa DATABASE_URL trong .env.local thành chuỗi Neon, rồi:
npm run db:migrate
npm run db:seed
# Xong nhớ đổi DATABASE_URL về chuỗi local (postgresql://capy:capy@localhost:5434/capydate)
```

## 4. Tạo Blob store (upload ảnh trong admin)

1. Tab **Storage** → **Create Database** → **Blob** → Create.
2. Vercel tự thêm `BLOB_READ_WRITE_TOKEN`. (Không tạo cũng được — admin vẫn dán URL ảnh trực tiếp, nút upload sẽ báo chưa cấu hình.)

## 5. Tạo Resend (email thông báo)

1. Đăng ký [resend.com](https://resend.com) (free 100 email/ngày) → **API Keys** → tạo key.
2. Không cần verify domain riêng: dùng from mặc định `onboarding@resend.dev` (đã đặt sẵn trong env). Lưu ý from này chỉ gửi được **tới đúng email bạn đăng ký Resend** — đặt `NOTIFY_EMAIL_TO` là email đó.

## 6. Điền env vars vào Vercel

Project → **Settings → Environment Variables**, thêm cho Production:

| Biến | Giá trị |
|---|---|
| `ADMIN_PASSWORD` | mật khẩu admin bạn tự đặt (đủ mạnh) |
| `ADMIN_SESSION_SECRET` | chuỗi random dài — chạy PowerShell: `-join ((1..64) \| %{ '{0:x}' -f (Get-Random -Max 16) })` |
| `RESEND_API_KEY` | key từ bước 5 |
| `NOTIFY_EMAIL_FROM` | `Capy Date <onboarding@resend.dev>` |
| `NOTIFY_EMAIL_TO` | email của bạn (email đăng ký Resend) |
| `NEXT_PUBLIC_SITE_URL` | `https://capydate.vercel.app` (URL thật sau khi deploy) |

(`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` đã được Storage tự thêm.)

## 7. Deploy & đổi domain

1. **Deployments → Redeploy** (hoặc push commit mới).
2. Settings → **Domains** → đổi thành `capydate.vercel.app` (nếu còn trống).

## 8. Điền nội dung thật qua admin

1. Mở `https://capydate.vercel.app/admin` → đăng nhập bằng `ADMIN_PASSWORD`.
2. **Nội dung**: tên bạn + tên nàng, lời mở đầu, câu hỏi, dresscode, điểm đón.
3. **Lịch**: slot giờ thật theo lịch của bạn, đánh các ngày bận.
4. **Quán & Phim**: thay 9 placeholder bằng quán/phim thật (ảnh dán URL từ Google Maps/fanpage hoặc upload).
5. Tự chạy thử full flow một lần trên **điện thoại** (mở bằng Chrome/Safari), submit thử, check email + trang Submissions, rồi xóa/kệ record test.
6. Gửi link cho nàng 🍊 (site đã noindex, OG image chỉ có capybara — không lộ tên khi preview link.)

## Ghi chú vận hành

- Đổi mật khẩu admin: đổi env `ADMIN_PASSWORD` → redeploy. Đăng xuất mọi phiên admin: đổi `ADMIN_SESSION_SECRET` → redeploy.
- Migration sau này: sửa `src/lib/db/schema.ts` → `npm run db:generate` → commit file trong `drizzle/` → `npm run db:migrate` với DATABASE_URL Neon. Không sửa file migration cũ.
- Xem data trực tiếp: Vercel → Storage → Neon → **Open in Neon Console** → Tables.
