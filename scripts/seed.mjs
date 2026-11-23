/**
 * Seed dữ liệu placeholder cho bảng options — chạy: npm run db:seed
 * (node --env-file=.env.local nên KHÔNG cần dotenv)
 * Idempotent: bảng options đã có dữ liệu thì bỏ qua.
 * Nội dung là placeholder — host thay bằng quán/phim thật qua admin panel.
 */
import pg from "pg";

const seedOptions = [
  // ---- activity ----
  {
    type: "activity",
    name: "Workshop làm gốm",
    description: "Tự tay nặn một chiếc cốc, lấm lem một chút cho vui.",
    priceRange: "250–350k/người",
    hostNote: "Sản phẩm mang về làm kỷ niệm — asset dùng lâu dài.",
    extra: null,
    sortOrder: 0,
  },
  {
    type: "activity",
    name: "Khu trò chơi & gắp thú",
    description: "Bắn bóng rổ, đua xe, gắp thú bông tới khi nào trúng thì thôi.",
    priceRange: "150–250k/2 người",
    hostNote: "Anh cam kết KPI: ít nhất một con thú bông.",
    extra: null,
    sortOrder: 1,
  },
  {
    type: "activity",
    name: "Dạo phố đi bộ & chụp ảnh",
    description: "Đi bộ thong thả, ăn vặt dọc đường, chụp vài tấm làm tư liệu.",
    priceRange: "Gần như miễn phí",
    hostNote: "Budget thấp, engagement cao.",
    extra: null,
    sortOrder: 2,
  },
  // ---- food ----
  {
    type: "food",
    name: "Quán nướng ấm cúng",
    description: "BBQ than hoa, không gian ấm, ngồi lâu không ai đuổi.",
    priceRange: "250–350k/người",
    hostNote: "Quán này anh review 5 sao, conversion rate cao lắm.",
    extra: null,
    sortOrder: 0,
  },
  {
    type: "food",
    name: "Tiệm pasta nhỏ xinh",
    description: "Đồ Ý nêm kiểu Việt, đèn vàng, nhạc nhẹ.",
    priceRange: "200–300k/người",
    hostNote: "Sốt kem nấm là signature — KPI là phải thử.",
    extra: null,
    sortOrder: 1,
  },
  {
    type: "food",
    name: "Quán lẩu để nói chuyện dài",
    description: "Lẩu nhẹ nhàng, hợp vừa ăn vừa kể chuyện cả buổi.",
    priceRange: "300–400k/2 người",
    hostNote: "Phương án an toàn: risk thấp, ROI cao.",
    extra: null,
    sortOrder: 2,
  },
  // ---- movie ----
  {
    type: "movie",
    name: "Phim rom-com đang hot",
    description: "Nhẹ nhàng dễ xem, cười nhiều hơn khóc.",
    priceRange: "~100k/vé",
    hostNote: "Đúng target audience của campaign này.",
    extra: { genre: "Rom-com", suggestedShowtime: "Suất tối sau giờ ăn" },
    sortOrder: 0,
  },
  {
    type: "movie",
    name: "Phim hoạt hình dễ thương",
    description: "An toàn tuyệt đối, không jumpscare, không plot twist nặng đô.",
    priceRange: "~100k/vé",
    hostNote: "Backup plan được lòng mọi stakeholder.",
    extra: { genre: "Animation", suggestedShowtime: "Suất chiều cuối tuần" },
    sortOrder: 1,
  },
  {
    type: "movie",
    name: "Bom tấn hành động",
    description: "Cháy nổ đã mắt, âm thanh rạp xịn mới đã.",
    priceRange: "~120k/vé",
    hostNote: "Phòng khi em thuộc team adrenaline.",
    extra: { genre: "Action", suggestedShowtime: "Suất tối" },
    sortOrder: 2,
  },
  // ---- cafe ----
  {
    type: "cafe",
    name: "Cafe sân vườn yên tĩnh",
    description: "Nhiều cây, ánh sáng đẹp, hợp để debrief cuối buổi.",
    priceRange: "45–75k/món",
    hostNote: "Cold brew cam là món tủ ở đây.",
    extra: null,
    sortOrder: 0,
  },
  {
    type: "cafe",
    name: "Tiệm trà & bánh ngọt",
    description: "Bánh ngon, ghế êm, ngồi bao lâu cũng được.",
    priceRange: "50–90k/món",
    hostNote: "Dành cho team hảo ngọt.",
    extra: null,
    sortOrder: 1,
  },
  {
    type: "cafe",
    name: "Rooftop ngắm đèn thành phố",
    description: "View cao, gió mát, đèn thành phố làm background xịn.",
    priceRange: "60–100k/món",
    hostNote: "Ending scene đúng chuẩn campaign một triệu view.",
    extra: null,
    sortOrder: 2,
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — chạy qua npm run db:seed (đọc .env.local)");
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM options");
    if (rows[0].count > 0) {
      console.log(`Bảng options đã có ${rows[0].count} dòng — bỏ qua seed.`);
      return;
    }
    for (const o of seedOptions) {
      await client.query(
        `INSERT INTO options
           (type, name, description, images, price_range, host_note, extra, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
        [
          o.type,
          o.name,
          o.description,
          JSON.stringify([]),
          o.priceRange,
          o.hostNote,
          o.extra === null ? null : JSON.stringify(o.extra),
          o.sortOrder,
        ]
      );
    }
    console.log(`Đã seed ${seedOptions.length} options placeholder.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed thất bại:", err);
  process.exit(1);
});
