/**
 * Detailed Read-Only Schema & Production Audit
 * Secrets redacted.
 */

const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const hostname = dbUrl.hostname;
  const ips = await dns.resolve4(hostname);

  const client = new Client({
    host: ips[0],
    port: 5432,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false, servername: hostname },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();

  console.log('=== DATABASE VERIFICATION (READ-ONLY) ===');
  console.log('Database Host Region: us-east-2 (AWS / Neon)');
  console.log('Database Name: neondb');

  // 1. Tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  const tables = tablesRes.rows.map((r) => r.table_name);
  console.log('\nPublic tables found:', tables);

  // 2. Row counts
  console.log('\nTable row counts:');
  for (const t of tables) {
    const countRes = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(`  ${t}: ${countRes.rows[0].count}`);
  }

  // 3. Columns for each table
  for (const t of tables) {
    console.log(`\n--- Columns for ${t} ---`);
    const cols = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${t}' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    cols.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name}) | nullable: ${c.is_nullable} | default: ${c.column_default}`);
    });
  }

  // 4. Constraints & Foreign Keys
  console.log('\n--- Constraints ---');
  const constraints = await client.query(`
    SELECT tc.constraint_name, tc.table_name, tc.constraint_type, kcu.column_name,
           ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_type;
  `);
  constraints.rows.forEach(c => {
    console.log(`  [${c.table_name}] ${c.constraint_type}: ${c.constraint_name} (${c.column_name}) -> ${c.foreign_table_name || ''}(${c.foreign_column_name || ''})`);
  });

  // 5. Check _prisma_migrations
  const hasMigrations = tables.includes('_prisma_migrations');
  console.log(`\n_prisma_migrations table exists: ${hasMigrations}`);

  await client.end();
}

run().catch(console.error);
