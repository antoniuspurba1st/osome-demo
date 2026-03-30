import { Pool, QueryResult, QueryResultRow } from "pg";

import { env } from "../config/env";

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const query = <T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> =>
  pool.query<T>(text, params);

export const checkDatabaseConnection = async () => {
  await query("SELECT 1");
};
