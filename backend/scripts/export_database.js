require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql2 = require('mysql2/promise');

async function main() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('✅ Connected to DB for export');

  let sql = '';
  sql += 'DROP DATABASE IF EXISTS health_monitor;\n';
  sql += 'CREATE DATABASE health_monitor;\n';
  sql += 'USE health_monitor;\n\n';
  sql += '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n';
  sql += '/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n';
  sql += '/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n';
  sql += '/*!50503 SET NAMES utf8 */;\n';
  sql += '/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;\n\n';

  const tables = ['Users', 'Devices', 'HealthRecords'];

  for (const table of tables) {
    console.log(`Dumping structure and data for table \`${table}\`...`);
    
    // 1. Get CREATE TABLE
    const [createRows] = await conn.execute(`SHOW CREATE TABLE \`${table}\``);
    const createTableSql = createRows[0]['Create Table'];
    
    sql += `--\n-- Table structure for table \`${table}\`\n--\n\n`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += `${createTableSql};\n\n`;

    // 2. Get Data
    const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
    
    sql += `--\n-- Dumping data for table \`${table}\`\n--\n\n`;
    sql += `LOCK TABLES \`${table}\` WRITE;\n`;
    
    if (rows.length > 0) {
      sql += `INSERT INTO \`${table}\` VALUES \n`;
      const valueLines = rows.map(row => {
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "\\'")}'`;
          }
          if (val instanceof Date) {
            const pad = (num) => String(num).padStart(2, '0');
            const yyyy = val.getFullYear();
            const mm = pad(val.getMonth() + 1);
            const dd = pad(val.getDate());
            const hh = pad(val.getHours());
            const min = pad(val.getMinutes());
            const ss = pad(val.getSeconds());
            return `'${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}'`;
          }
          if (typeof val === 'boolean') {
            return val ? '1' : '0';
          }
          if (Buffer.isBuffer(val)) {
            return `X'${val.toString('hex')}'`;
          }
          return val;
        });
        return `  (${values.join(',')})`;
      });
      sql += valueLines.join(',\n') + ';\n';
    }
    
    sql += `UNLOCK TABLES;\n\n`;
  }

  sql += '/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n';
  sql += '/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n';
  sql += '/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n';
  sql += '/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n';

  const destPath = 'c:/Users/Lenovo/Desktop/do an/mon t4/project_nhung/database/health_monitor_with_mock_data.sql';
  fs.writeFileSync(destPath, sql, 'utf8');
  console.log(`🎉 Database dump completed successfully! Saved to ${destPath}`);

  await conn.end();
}

main().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
