import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

// Create a connection pool for migrations
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function runMigration(migrationFile: string) {
  const migrationPath = join(__dirname, '../../database/migration', migrationFile);
  
  console.log(`Reading migration file: ${migrationFile}`);
  const sql = readFileSync(migrationPath, 'utf-8');
  
  console.log(`Running migration: ${migrationFile}`);
  try {
    await pool.query(sql);
    console.log(`✓ Migration ${migrationFile} completed successfully`);
  } catch (error: any) {
    console.error(`✗ Migration ${migrationFile} failed:`, error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: ts-node scripts/run-migration.ts <migration-file>');
  console.error('Example: ts-node scripts/run-migration.ts V6_create_agent_test_tables.sql');
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

