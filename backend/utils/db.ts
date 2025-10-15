import { Pool } from "pg";

// Use environment variables set in your Lambda configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

// Export a query function
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};