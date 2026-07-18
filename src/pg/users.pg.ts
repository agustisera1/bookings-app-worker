import { PgUser, query } from "./index.js";

export async function findUserById(id: string): Promise<PgUser | null> {
  const result = await query<PgUser>(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}
