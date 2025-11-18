# Aurora PostgreSQL Database

This folder contains Aurora PostgreSQL schema definitions and migration scripts.
See ADR-003 for decision rationale.

## Running Migrations

Migrations are run using a simple Node.js script in the backend.

### Setup

1. Install dependencies (if not already done):
```bash
cd backend
npm install
```

2. Set environment variables for database connection:
```bash
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_USER=your-username
export DB_PASSWORD=your-password
export DB_NAME=postgres
export DB_SSL=true  # Set to 'true' for AWS RDS
```

Or create a `.env` file in the `backend/` directory (you'll need `dotenv` package for this).

### Running a Migration

```bash
cd backend
npm run migrate V6_create_agent_test_tables.sql
```

Or using ts-node directly:
```bash
cd backend
ts-node scripts/run-migration.ts V6_create_agent_test_tables.sql
```

### Verifying Migrations

After running a migration, you can verify the tables were created:

```sql
-- List agent test tables
\dt agent_test_*;

-- Describe the tables
\d agent_test_runs;
\d agent_test_tasks;
```

## Migration Files

Migrations are numbered sequentially (V1_, V2_, etc.) and should be run in order:
- V1_create_tables.sql - Initial schema
- V2_seed_personas.sql - Seed data
- V3_validation.sql - Validation constraints
- V4_question_types.sql - Question type updates
- V5_runs_traceability.sql - Run tracking
- V6_create_agent_test_tables.sql - Agent test tables
