/**
 * R0 Read-Only Production Audit Script
 * Audits deployed endpoints and database state without changing any data.
 * Secrets are strictly redacted.
 */

const https = require('https');
const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');
require('dotenv').config();

function httpReq(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: data
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
          : {},
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function auditHttp() {
  console.log('=== HTTP ENDPOINT AUDIT ===');

  // 1. Render direct
  const renderRoot = await httpReq('https://mehrchain-api.onrender.com/api');
  console.log('Render GET /api:', renderRoot.status, renderRoot.body);

  const renderGoogle = await httpReq(
    'https://mehrchain-api.onrender.com/api/auth/google',
    'POST',
    JSON.stringify({ idToken: 'deliberately-invalid-token' })
  );
  console.log('Render POST /api/auth/google:', renderGoogle.status, renderGoogle.body);

  const renderDocs = await httpReq('https://mehrchain-api.onrender.com/api/docs-json');
  console.log('Render GET /api/docs-json:', renderDocs.status, renderDocs.status === 200 ? 'Swagger JSON available' : renderDocs.body?.slice(0, 100));

  let availableRoutes = [];
  if (renderDocs.status === 200) {
    try {
      const swagger = JSON.parse(renderDocs.body);
      availableRoutes = Object.keys(swagger.paths || {});
      console.log('Registered Routes in deployed Swagger:');
      availableRoutes.forEach((r) => console.log('  -', r));
    } catch {}
  }

  // 2. Cloudflare Pages proxy
  const pagesRoot = await httpReq('https://mehrchain.pages.dev/api');
  console.log('\nCloudflare GET /api:', pagesRoot.status, pagesRoot.body);

  const pagesGoogle = await httpReq(
    'https://mehrchain.pages.dev/api/auth/google',
    'POST',
    JSON.stringify({ idToken: 'deliberately-invalid-token' })
  );
  console.log('Cloudflare POST /api/auth/google:', pagesGoogle.status, pagesGoogle.body);

  return { renderRoot, renderGoogle, availableRoutes, pagesRoot, pagesGoogle };
}

async function auditDatabase() {
  console.log('\n=== DATABASE STATE AUDIT (READ-ONLY) ===');
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set in environment.');
    return { status: 'unverified', reason: 'DATABASE_URL missing' };
  }

  const rawUrl = process.env.DATABASE_URL;
  const dbUrl = new URL(rawUrl);
  const hostname = dbUrl.hostname;
  console.log('Database Host (Redacted):', hostname.replace(/[^.]+\./, '***.'));
  console.log('Database Name:', dbUrl.pathname.replace(/^\//, ''));

  let client;
  try {
    const ips = await dns.resolve4(hostname);
    client = new Client({
      host: ips[0],
      port: parseInt(dbUrl.port || '5432', 10),
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.replace(/^\//, ''),
      ssl: { rejectUnauthorized: false, servername: hostname },
    });
    await client.connect();
    console.log('Successfully connected to database with read-only connection!');
  } catch (err) {
    console.log('Database connection error:', err.message);
    return { status: 'unverified', reason: err.message };
  }

  try {
    // 1. Check existing tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map((r) => r.table_name);
    console.log('\nTables present in public schema:');
    console.log(tables);

    const requiredTables = [
      'users',
      'commitments',
      'commitment_logs',
      'chain_connections',
      'chain_invites',
      '_prisma_migrations',
    ];

    const tableReport = {};
    for (const t of requiredTables) {
      tableReport[t] = tables.includes(t);
    }
    console.log('\nRequired tables status:');
    console.table(tableReport);

    // 2. Schema columns for key tables
    for (const table of ['users', 'commitments', 'chain_connections', 'chain_invites']) {
      if (tables.includes(table)) {
        const colsRes = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${table}' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `);
        console.log(`\nColumns in table "${table}":`);
        console.table(colsRes.rows);
      }
    }

    // 3. Foreign keys
    const fkRes = await client.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
    `);
    console.log('\nForeign key constraints:');
    console.table(fkRes.rows);

    // 4. Migration table
    if (tables.includes('_prisma_migrations')) {
      const migRes = await client.query(`SELECT * FROM _prisma_migrations ORDER BY started_at;`);
      console.log('\n_prisma_migrations records:');
      console.table(migRes.rows);
    } else {
      console.log('\nNote: _prisma_migrations table does NOT exist.');
    }

    // 5. Row counts
    console.log('\nRow counts:');
    for (const t of tables) {
      const cntRes = await client.query(`SELECT COUNT(*) as count FROM "${t}";`);
      console.log(`  ${t}: ${cntRes.rows[0].count}`);
    }

    await client.end();
    return { status: 'verified', tables, tableReport };
  } catch (queryErr) {
    console.error('Error during read-only SQL queries:', queryErr.message);
    if (client) await client.end();
    return { status: 'error', reason: queryErr.message };
  }
}

async function main() {
  await auditHttp();
  await auditDatabase();
}

main().catch(console.error);
