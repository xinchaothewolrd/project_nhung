require('dotenv').config();
const mysql2 = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('✅ Kết nối DB thành công');

  // 1. Alter ENUM để thêm 'ADMIN'
  await conn.execute(
    "ALTER TABLE Users MODIFY COLUMN role ENUM('PATIENT','DOCTOR','ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT 'PATIENT'"
  );
  console.log("✅ Đã cập nhật ENUM role thêm 'ADMIN'");

  // 2. Hash mật khẩu 123456
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash('123456', salt);

  // 3. Insert hoặc update tài khoản admin
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const [rows] = await conn.execute("SELECT id FROM Users WHERE username = 'admin'");

  if (rows.length > 0) {
    await conn.execute(
      "UPDATE Users SET password_hash = ?, role = 'ADMIN', full_name = 'Administrator', updatedAt = ? WHERE username = 'admin'",
      [password_hash, now]
    );
    console.log("✅ Đã cập nhật tài khoản admin (username: admin, password: 123456)");
  } else {
    await conn.execute(
      "INSERT INTO Users (username, password_hash, role, full_name, createdAt, updatedAt) VALUES ('admin', ?, 'ADMIN', 'Administrator', ?, ?)",
      [password_hash, now, now]
    );
    console.log("✅ Đã tạo tài khoản admin (username: admin, password: 123456)");
  }

  await conn.end();
  console.log('🎉 Hoàn tất!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
