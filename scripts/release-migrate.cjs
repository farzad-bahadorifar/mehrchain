const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const action = process.argv[2];
if (!['prepare', 'status', 'deploy', 'resolve-baseline'].includes(action)) {
  console.error('Usage: node scripts/release-migrate.cjs prepare|status|deploy|resolve-baseline');
  process.exit(1);
}
const prisma = path.resolve('apps/mehrchain-backend/prisma');
const work = path.join(prisma, '.release-prisma');
fs.mkdirSync(work, { recursive: true });
fs.copyFileSync(path.join(prisma, 'schema.prisma'), path.join(work, 'schema.prisma'));
fs.cpSync(path.join(prisma, 'release-migrations'), path.join(work, 'migrations'), {
  recursive: true,
});
if (action === 'prepare') {
  console.log('Prepared release schema and migration chain. No database connection.');
  process.exit(0);
}
if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL in your shell.');
  process.exit(1);
}
if (action === 'resolve-baseline' && process.env.BASELINE_SCHEMA_VERIFIED !== 'yes') {
  console.error(
    'First back up and verify zero schema drift; see docs/database_migration_procedure.md. Then set BASELINE_SCHEMA_VERIFIED=yes.',
  );
  process.exit(1);
}
const command =
  action === 'resolve-baseline'
    ? ['migrate', 'resolve', '--applied', '20261005000000_release_baseline']
    : ['migrate', action];
if (action === 'resolve-baseline') {
  const drift = spawnSync(
    process.execPath,
    [
      path.resolve('node_modules/prisma/build/index.js'),
      'migrate',
      'diff',
      '--from-schema-datasource',
      path.join(work, 'schema.prisma'),
      '--to-schema-datamodel',
      path.join(work, 'schema.prisma'),
      '--exit-code',
    ],
    { stdio: 'inherit' },
  );
  if (drift.status !== 0) {
    console.error('Baseline refused: schema drift or connectivity failure.');
    process.exit(1);
  }
}
const result = spawnSync(
  process.execPath,
  [
    path.resolve('node_modules/prisma/build/index.js'),
    ...command,
    '--schema',
    path.join(work, 'schema.prisma'),
  ],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
