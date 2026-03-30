import { QueryResult, QueryResultRow } from "pg";

import { DatabaseClient, query, withTransaction } from "./pool";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
}

interface InsertUserRow extends UserRecord {
  created_at: Date;
}

interface IdempotencyRow {
  response_body: CreateUserResponse;
  status_code: number;
}

export type UserStatus = "pending" | "active" | "inactive";

export interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserResult {
  responseBody: CreateUserResponse;
  statusCode: number;
  wasReplayed: boolean;
  user: UserRecord;
}

interface StatusRow {
  id: number;
  status: UserStatus;
}

interface QueryExecutor {
  query: <T extends QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;
}

const mapUserResponse = (user: UserRecord): CreateUserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const insertUserRecord = async (executor: QueryExecutor, name: string, email: string): Promise<UserRecord> => {
  const result = await executor.query<InsertUserRow>(
    `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email, status, created_at
    `,
    [name, email],
  );

  const user = result.rows[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
  };
};

export const createUser = async (name: string, email: string): Promise<UserRecord> =>
  insertUserRecord(
    {
      query: (text, params) => query(text, params),
    },
    name,
    email,
  );

export const createUserWithIdempotency = async (
  name: string,
  email: string,
  idempotencyKey?: string,
): Promise<CreateUserResult> => {
  if (!idempotencyKey) {
    const user = await createUser(name, email);

    return {
      responseBody: mapUserResponse(user),
      statusCode: 201,
      wasReplayed: false,
      user,
    };
  }

  return withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [idempotencyKey]);

    const existingResult = await client.query<IdempotencyRow>(
      `
        SELECT response_body, status_code
        FROM idempotency_keys
        WHERE key = $1
      `,
      [idempotencyKey],
    );

    const existing = existingResult.rows[0];

    if (existing) {
      return {
        responseBody: existing.response_body,
        statusCode: existing.status_code,
        wasReplayed: true,
        user: {
          ...existing.response_body,
          status: "pending",
        },
      };
    }

    const user = await insertUserRecord(client, name, email);
    const responseBody = mapUserResponse(user);

    await client.query(
      `
        INSERT INTO idempotency_keys (key, response_body, status_code)
        VALUES ($1, $2::jsonb, $3)
      `,
      [idempotencyKey, JSON.stringify(responseBody), 201],
    );

    return {
      responseBody,
      statusCode: 201,
      wasReplayed: false,
      user,
    };
  });
};

export const listUsers = async (): Promise<UserRecord[]> => {
  const result = await query<UserRecord>(
    `
      SELECT id, name, email, status
      FROM users
      ORDER BY id ASC
    `,
  );

  return result.rows;
};

export const findUserById = async (id: number): Promise<UserRecord | null> => {
  const result = await query<UserRecord>(
    `
      SELECT id, name, email, status
      FROM users
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
};

export const updateUserStatus = async (id: number, status: UserStatus): Promise<StatusRow | null> => {
  const result = await query<StatusRow>(
    `
      UPDATE users
      SET status = $2
      WHERE id = $1
      RETURNING id, status
    `,
    [id, status],
  );

  return result.rows[0] ?? null;
};
