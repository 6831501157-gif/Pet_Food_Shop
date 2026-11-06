// Add the expiry field without re-importing or replacing any existing data.
process.loadEnvFile('.env.local');
(async () => {
  const mysql = await import('mysql2/promise');
  const c = await mysql.createConnection({host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME});
  try {
    const [rows] = await c.query('SHOW COLUMNS FROM purchase_details LIKE ?', ['expiry_date']);
    if (!rows.length) await c.query('ALTER TABLE purchase_details ADD COLUMN expiry_date DATE NULL');
    console.log('Receiving schema ready; existing data preserved');
  } finally { await c.end(); }
})().catch(e => { console.error(e.code || e.message); process.exitCode = 1; });
