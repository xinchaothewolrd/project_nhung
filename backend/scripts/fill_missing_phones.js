require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function main() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('✅ Connected to DB');

  // Query all users
  const [users] = await conn.execute("SELECT id, username, full_name, phone FROM Users");
  console.log(`Found ${users.length} users:`);
  
  let updateCount = 0;
  for (const user of users) {
    if (!user.phone || user.phone.trim() === '') {
      // Generate phone number: e.g., 0912000000 + id
      const paddedId = String(user.id).padStart(3, '0');
      const generatedPhone = `0912000${paddedId}`;
      
      await conn.execute("UPDATE Users SET phone = ? WHERE id = ?", [generatedPhone, user.id]);
      console.log(`  Updating user '${user.username}' (ID: ${user.id}): set phone to ${generatedPhone}`);
      updateCount++;
    } else {
      console.log(`  User '${user.username}' (ID: ${user.id}) already has phone: ${user.phone}`);
    }
  }

  await conn.end();
  console.log(`🎉 Done updating! Updated ${updateCount} users.`);
}

main().catch(err => {
  console.error('❌ Error:', err);
});
