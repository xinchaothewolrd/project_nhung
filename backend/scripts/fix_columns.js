require('dotenv').config();
const mysql2 = require('mysql2/promise');

(async () => {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  // Kiểm tra và thêm các cột còn thiếu
  const columns = [
    { name: 'phone', def: 'VARCHAR(20) DEFAULT NULL' },
  ];

  for (const col of columns) {
    try {
      await conn.execute(`ALTER TABLE Users ADD COLUMN ${col.name} ${col.def}`);
      console.log(`✅ Đã thêm cột '${col.name}'`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️  Cột '${col.name}' đã tồn tại`);
      } else {
        console.error(`❌ Lỗi cột '${col.name}':`, e.message);
      }
    }
  }

  await conn.end();
  console.log('🎉 Xong!');
})().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
