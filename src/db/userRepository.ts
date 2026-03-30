import { query } from "./pool";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
}

interface InsertUserRow extends UserRecord {
  created_at: Date;
}

export const insertUser = async (name: string, email: string): Promise<UserRecord> => {
  const result = await query<InsertUserRow>(
    `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email, created_at
    `,
    [name, email],
  );

  const user = result.rows[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

export const listUsers = async (): Promise<UserRecord[]> => {
  const result = await query<UserRecord>(
    `
      SELECT id, name, email
      FROM users
      ORDER BY id ASC
    `,
  );

  return result.rows;
};
