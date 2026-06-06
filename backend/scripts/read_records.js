const HealthRecord = require('../models/HealthRecord');
const sequelize = require('../config/database');

async function main() {
  const records = await HealthRecord.findAll({ order: [['createdAt', 'DESC']] });
  console.log(records.map(r => ({ id: r.id, bpm: r.bpm, spo2: r.spo2, createdAt: r.createdAt })));
  process.exit(0);
}
main().catch(console.error);
